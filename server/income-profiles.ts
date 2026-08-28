import { prisma } from "@/lib/prisma";
import { getAuthContext, requireSpaceAccess } from "@/server/auth-context";

export async function getIncomeProfiles(spaceId: string) {
  await requireSpaceAccess(spaceId, "read");
  const context = await getAuthContext();
  const sharedSpaces = context ? await prisma.financialSpace.findMany({
    where: {
      members: { some: { userId: context.user.id, status: "active" } },
      AND: { members: { some: { userId: { not: context.user.id }, status: "active" } } },
    },
    select: { id: true },
  }) : [];
  const visibleSpaceIds = Array.from(new Set([spaceId, ...sharedSpaces.map((space) => space.id)]));
  const rows = await prisma.incomeProfile.findMany({ where: { financialSpaceId: { in: visibleSpaceIds } }, include: { owner: { select: { name: true } }, account: { select: { name: true } } }, orderBy: { paymentDay: "asc" } });
  return rows.map(({ owner, account, ...profile }) => ({ ...profile, ownerName: owner.name, accountName: account.name, readOnly: profile.financialSpaceId !== spaceId }));
}
