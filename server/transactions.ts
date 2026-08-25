import { prisma } from "@/lib/prisma";
import { requireSpaceAccess } from "@/server/auth-context";
import { resolveTransactionStatus } from "@/lib/finance-rules";
import { dateOnly } from "@/lib/prisma-utils";
import { ensureDefaultCategories } from "@/server/categories";

export async function getTransactions(filters?: { search?: string; kind?: string; status?: string; spaceId?: string }) {
  const spaceId = filters?.spaceId ?? "personal-space";
  await requireSpaceAccess(spaceId, "read");
  const rows = await prisma.transaction.findMany({ where: { financialSpaceId: spaceId, status: { in: ["paid", "pending", "cancelled"] }, ...(filters?.search?.trim() ? { description: { contains: filters.search.trim(), mode: "insensitive" } } : {}), ...(filters?.kind && filters.kind !== "all" ? { kind: filters.kind } : {}), ...(filters?.status && filters.status !== "all" && filters.status !== "overdue" ? { status: filters.status } : {}) }, include: { account: { include: { owner: { select: { image: true } } } }, category: { select: { name: true } } }, orderBy: { competenceDate: "desc" } });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const resolved = rows.map((row) => ({ id: row.id, description: row.description, source: row.source, amountCents: row.amountCents, kind: row.kind, status: resolveTransactionStatus(row.status as "pending" | "paid" | "overdue" | "cancelled", dateOnly(row.dueDate), today), competenceDate: dateOnly(row.competenceDate)!, dueDate: dateOnly(row.dueDate), accountId: row.accountId, categoryId: row.categoryId, accountName: row.account.name, accountType: row.account.type, accountOwnerImage: row.account.type === "credit_card" ? row.account.owner?.image ?? null : null, categoryName: row.category?.name ?? null }));
  return filters?.status && filters.status !== "all" ? resolved.filter((row) => row.status === filters.status) : resolved;
}

export async function getTransactionOptions(spaceId = "personal-space") {
  await requireSpaceAccess(spaceId, "read");
  await ensureDefaultCategories(spaceId);
  const [accounts, categories] = await Promise.all([prisma.financialAccount.findMany({ where: { financialSpaceId: spaceId, archivedAt: null }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }), prisma.category.findMany({ where: { financialSpaceId: spaceId }, select: { id: true, name: true, kind: true }, orderBy: { name: "asc" } })]);
  return { accounts: accounts.map(({ id: value, name: label, type }) => ({ value, label, type })), categories: categories.map(({ id: value, name: label, kind }) => ({ value, label, kind })) };
}
