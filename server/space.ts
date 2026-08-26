import { redirect } from "next/navigation";
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
  const requested = value && memberships.some((membership) => membership.financialSpaceId === value) ? value : memberships[0]?.financialSpaceId;
  if (!requested) throw new Error("FORBIDDEN");
  return requested;
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
  const spaces = await prisma.financialSpace.findMany({ where: { id: { in: memberships.map(({ financialSpaceId }) => financialSpaceId) } }, include: { members: { where: { status: "active" }, include: { user: { select: { id: true, name: true, image: true } } } } } });

  return memberships.flatMap(({ financialSpaceId, role }) => {
    const space = spaces.find(({ id }) => id === financialSpaceId);
    if (!space) return [];
    const rows = space.members;
    const names = Array.from(new Set(rows.map(({ user }) => user.name.trim()).filter(Boolean)));
    const firstNames = names.map((name) => name.split(/\s+/)[0]);
    const current = rows.find(({ user }) => user.id === context.user.id);
    const isJoint = rows.length > 1;
    const name = isJoint ? firstNames.slice(0, 2).join(" & ") : firstNames[0] ?? space.name;
    const initials = isJoint ? firstNames.slice(0, 2).map((item) => item[0]).join("").toUpperCase() : (firstNames[0]?.slice(0, 2) ?? "F").toUpperCase();
    const description = isJoint ? "Conta conjunta" : ["owner", "admin"].includes(role) ? "Conta do administrador" : "Conta convidado";
    return [{ value: space.id, initials, name, description, image: current?.user.image ?? null, role }];
  });
}
