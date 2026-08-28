import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/server/auth-context";

export const demoSpaces = ["personal-space", "raissa-space", "combined-space"] as const;
export type DemoSpaceId = (typeof demoSpaces)[number];
export type AvailableSpace = { value: string; initials: string; name: string; description: string; image: string | null; role: string };
export function normalizeSpaceId(value?: string): DemoSpaceId { return demoSpaces.includes(value as DemoSpaceId) ? value as DemoSpaceId : "personal-space"; }

export async function resolveSpaceId(value?: string) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  const memberships = await prisma.spaceMember.findMany({ where: { userId: context.user.id, status: "active" }, select: { financialSpaceId: true } });
  const directlyAccessible = value && memberships.some((membership) => membership.financialSpaceId === value);
  const linkedPersonal = value && !directlyAccessible
    ? await getLinkedPersonalSpaceIds(context.user.id, memberships.map(({ financialSpaceId }) => financialSpaceId))
    : [];
  const requested = value && (directlyAccessible || linkedPersonal.includes(value)) ? value : memberships[0]?.financialSpaceId;
  if (!requested) throw new Error("FORBIDDEN");
  return requested;
}

async function getLinkedPersonalSpaceIds(userId: string, directSpaceIds: string[]) {
  if (!directSpaceIds.length) return [];
  const spaces = await prisma.financialSpace.findMany({
    where: { id: { in: directSpaceIds }, members: { some: { userId, status: "active" } } },
    select: { ownerId: true, members: { where: { status: "active" }, select: { userId: true } } },
  });
  const participantIds = Array.from(new Set(spaces.filter((space) => space.members.length > 1).flatMap((space) => space.members.map(({ userId: memberId }) => memberId))));
  if (!participantIds.length) return [];
  const personalSpaces = await prisma.financialSpace.findMany({
    where: { ownerId: { in: participantIds } },
    select: { id: true, ownerId: true, members: { where: { status: "active" }, select: { userId: true } } },
  });
  return personalSpaces.filter((space) => space.members.length === 1 && space.members[0]?.userId === space.ownerId).map(({ id }) => id);
}

export async function getSpaceDisplayName(spaceId: string) {
  const members = await prisma.spaceMember.findMany({ where: { financialSpaceId: spaceId, status: "active" }, include: { user: { select: { name: true } } } });
  const firstNames = members.map(({ user }) => user.name.trim().split(/\s+/)[0]).filter(Boolean);
  if (!firstNames.length) return "Seu espaço";
  return firstNames.length === 1 ? firstNames[0] : firstNames.slice(0, 2).join(" & ");
}

export async function getAvailableSpaces(): Promise<AvailableSpace[]> {
  const context = await getAuthContext();
  if (!context) return [];
  const memberships = await prisma.spaceMember.findMany({ where: { userId: context.user.id, status: "active" }, select: { financialSpaceId: true, role: true }, orderBy: { createdAt: "asc" } });
  const directSpaceIds = memberships.map(({ financialSpaceId }) => financialSpaceId);
  const directSpaces = await prisma.financialSpace.findMany({ where: { id: { in: directSpaceIds } }, include: { members: { where: { status: "active" }, include: { user: { select: { id: true, name: true, image: true } } } } } });
  await ensureLinkedPersonalSpaces(directSpaces);
  const sharedParticipantIds = Array.from(new Set(directSpaces.filter((space) => space.members.length > 1).flatMap((space) => space.members.map(({ user }) => user.id))));
  const linkedPersonalSpaces = sharedParticipantIds.length ? await prisma.financialSpace.findMany({ where: { ownerId: { in: sharedParticipantIds } }, include: { members: { where: { status: "active" }, include: { user: { select: { id: true, name: true, image: true } } } } } }) : [];
  const linkedPersonal = linkedPersonalSpaces.filter((space) => space.members.length === 1 && space.members[0]?.user.id === space.ownerId);
  const spaces = Array.from(new Map([...directSpaces, ...linkedPersonal].map((space) => [space.id, space])).values())
    .sort((left, right) => Number(Boolean(right.personalKey)) - Number(Boolean(left.personalKey)) || left.createdAt.getTime() - right.createdAt.getTime())
    .filter((space, index, all) => {
      if (space.members.length !== 1 || space.members[0]?.user.id !== space.ownerId) return true;
      return all.findIndex((candidate) => candidate.members.length === 1 && candidate.members[0]?.user.id === candidate.ownerId && candidate.ownerId === space.ownerId) === index;
    });
  const roleBySpace = new Map(memberships.map(({ financialSpaceId, role }) => [financialSpaceId, role]));

  return spaces.flatMap((space) => {
    const rows = space.members;
    if (!rows.length) return [];
    const names = Array.from(new Set(rows.map(({ user }) => user.name.trim()).filter(Boolean)));
    const firstNames = names.map((name) => name.split(/\s+/)[0]);
    const owner = rows.find(({ user }) => user.id === space.ownerId)?.user;
    const isJoint = rows.length > 1;
    const name = isJoint ? firstNames.slice(0, 2).join(" & ") : firstNames[0] ?? space.name;
    const initials = isJoint ? firstNames.slice(0, 2).map((item) => item[0]).join("").toUpperCase() : (firstNames[0]?.slice(0, 2) ?? "F").toUpperCase();
    const role = roleBySpace.get(space.id) ?? "viewer";
    const description = isJoint ? "Conta conjunta" : owner?.id === context.user.id ? "Conta do administrador" : "Conta individual";
    return [{ value: space.id, initials, name, description, image: owner?.image ?? null, role }];
  }).sort((left, right) => Number(left.description === "Conta conjunta") - Number(right.description === "Conta conjunta") || left.name.localeCompare(right.name, "pt-BR"));
}

type LinkedSpace = { members: Array<{ user: { id: string; name: string } }> };

async function ensureLinkedPersonalSpaces(spaces: LinkedSpace[]): Promise<void> {
  const participants = Array.from(new Map(
    spaces
      .filter((space) => space.members.length > 1)
      .flatMap((space) => space.members.map((member) => [member.user.id, member.user] as const)),
  ).values());
  if (!participants.length) return;

  await prisma.$transaction(async (tx) => {
    for (const participant of participants) {
      const id = randomUUID();
      const personal = await tx.financialSpace.upsert({
        where: { personalKey: `${participant.id}:personal` },
        create: { id, name: `Conta de ${participant.name.trim()}`, ownerId: participant.id, personalKey: `${participant.id}:personal` },
        update: {},
        select: { id: true },
      });
      await tx.spaceMember.upsert({
        where: { financialSpaceId_userId: { financialSpaceId: personal.id, userId: participant.id } },
        create: { id: randomUUID(), financialSpaceId: personal.id, userId: participant.id, role: "owner", status: "active" },
        update: { status: "active", role: "owner", updatedAt: new Date() },
      });
    }
  });
}
