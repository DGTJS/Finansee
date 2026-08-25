import { prisma } from "@/lib/prisma";
import { requireSpaceAccess } from "@/server/auth-context";

export async function getIncomeProfiles(spaceId: string) {
  await requireSpaceAccess(spaceId, "read");
  const rows = await prisma.incomeProfile.findMany({ where: { financialSpaceId: spaceId }, include: { owner: { select: { name: true } }, account: { select: { name: true } } }, orderBy: { paymentDay: "asc" } });
  return rows.map(({ owner, account, ...profile }) => ({ ...profile, ownerName: owner.name, accountName: account.name }));
}
