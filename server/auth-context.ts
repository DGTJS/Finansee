import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeaderClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

type SpacePermission = "read" | "transactions:write" | "accounts:write" | "planning:write";
type Membership = Awaited<ReturnType<typeof prisma.spaceMember.findFirst>>;

export async function getAuthContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ? { user: session.user, session: session.session } : null;
}

export async function getCurrentUserId() {
  const context = await getAuthContext();
  if (!context) throw new Error("AUTH_REQUIRED");
  return context.user.id;
}

export async function requireSpaceAccess(spaceId: string, permission: SpacePermission): Promise<NonNullable<Membership>> {
  const context = await getAuthContext();
  if (!context) throw new Error("AUTH_REQUIRED");
  const key = await getHeaderClientKey(`space:${spaceId}`, context.user.id);
  const membership = await withRequestLimit(key, () => prisma.spaceMember.findFirst({ where: { financialSpaceId: spaceId, userId: context.user.id, status: "active" } }), { limit: 120, windowMs: 60_000, concurrency: 12, timeoutMs: 5_000 });
  if (membership && canAccess(membership.role, permission, membership.permissions as Record<string, boolean>)) return membership;
  if (permission !== "read") throw new Error("FORBIDDEN");
  const sharedSpaces = await prisma.financialSpace.findMany({ where: { members: { some: { userId: context.user.id, status: "active" } } }, select: { members: { where: { status: "active" }, select: { userId: true } } } });
  const participantIds = Array.from(new Set(sharedSpaces.filter((space) => space.members.length > 1).flatMap((space) => space.members.map(({ userId }) => userId))));
  if (!participantIds.length) throw new Error("FORBIDDEN");
  const linkedPersonal = await prisma.financialSpace.findMany({ where: { id: spaceId, ownerId: { in: participantIds } }, include: { members: { where: { status: "active" }, select: { userId: true } } } });
  const personal = linkedPersonal.find((space) => space.members.length === 1 && space.members[0]?.userId === space.ownerId);
  if (!personal) throw new Error("FORBIDDEN");
  return { id: `linked:${personal.id}`, financialSpaceId: personal.id, userId: context.user.id, role: "viewer", status: "active", permissions: { read: true }, createdAt: new Date(), updatedAt: new Date() } as NonNullable<Membership>;
}

function canAccess(role: string, permission: SpacePermission, overrides: Record<string, boolean> = {}) {
  if (role === "owner" || role === "admin") return true;
  if (permission in overrides) return overrides[permission] === true;
  if (role === "viewer") return permission === "read";
  return permission === "read" || permission === "transactions:write";
}

export function authorizationMessage(error: unknown) {
  if (error instanceof RequestLimitError) return error.message;
  if (error instanceof Error && error.message === "AUTH_REQUIRED") return "Faça login para continuar.";
  if (error instanceof Error && error.message === "FORBIDDEN") return "Você não tem permissão para esta operação.";
  return null;
}
