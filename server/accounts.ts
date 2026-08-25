import { prisma } from "@/lib/prisma";
import { requireSpaceAccess } from "@/server/auth-context";
import { getBusinessDate } from "@/lib/business-date";

export async function getAccounts(spaceId = "personal-space") {
  await requireSpaceAccess(spaceId, "read");
  const accounts = await prisma.financialAccount.findMany({ where: { financialSpaceId: spaceId, archivedAt: null }, include: { owner: { select: { name: true, image: true } } }, orderBy: { name: "asc" } });
  const today = Number(getBusinessDate().slice(-2));
  return accounts.map(({ owner, ...account }) => ({ ...account, ownerName: owner?.name ?? "Responsável", ownerImage: owner?.image ?? null, ownerInitials: (owner?.name ?? "R").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), daysUntilDue: account.dueDay ? (account.dueDay - today + 31) % 31 : null })).sort((left, right) => { if (left.daysUntilDue === null) return 1; if (right.daysUntilDue === null) return -1; return left.daysUntilDue - right.daysUntilDue; });
}
