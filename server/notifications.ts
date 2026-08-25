import { prisma } from "@/lib/prisma";
import { requireSpaceAccess } from "@/server/auth-context";
import { getSpaceAlerts } from "@/server/alerts";

export async function getNotifications(spaceId = "personal-space") {
  await requireSpaceAccess(spaceId, "read");
  const [allAlerts, transactions] = await Promise.all([getSpaceAlerts(spaceId), prisma.transaction.findMany({ where: { financialSpaceId: spaceId }, include: { account: { include: { owner: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 8 }).then((rows) => rows.map((row) => ({ id: row.id, description: row.description, amountCents: row.amountCents, kind: row.kind, status: row.status, accountName: row.account.name, accountOwnerName: row.account.owner?.name ?? null, createdAt: row.createdAt }))) ]);
  const alerts = allAlerts.sort((left, right) => Number(Boolean(left.readAt)) - Number(Boolean(right.readAt)) || right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 8);
  return { alerts, transactions, unreadCount: allAlerts.filter((item) => !item.readAt).length, fetchedAt: new Date().toISOString() };
}

export async function markSpaceNotificationsRead(spaceId = "personal-space") {
  await requireSpaceAccess(spaceId, "read");
  const now = new Date();
  const result = await prisma.alert.updateMany({ where: { financialSpaceId: spaceId, readAt: null }, data: { readAt: now, updatedAt: now } });
  return result.count;
}
