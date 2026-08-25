import { prisma } from "@/lib/prisma";
import { getBusinessDate, getBusinessMonth } from "@/lib/business-date";
import { dateOnly } from "@/lib/prisma-utils";

type StoredAlert = Awaited<ReturnType<typeof prisma.alert.findMany>>[number];

export async function getSpaceAlerts(spaceId: string, month = getBusinessMonth()) {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonth = monthNumber === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;
  const from = new Date(`${month}-01T00:00:00Z`); const to = new Date(`${nextMonth}T00:00:00Z`);
  const [budgets, categories, transactions, accounts, stored] = await Promise.all([
    prisma.budget.findMany({ where: { financialSpaceId: spaceId }, select: { id: true, categoryId: true, month: true, limitCents: true } }),
    prisma.category.findMany({ where: { financialSpaceId: spaceId }, select: { id: true, name: true } }),
    prisma.transaction.findMany({ where: { financialSpaceId: spaceId, competenceDate: { gte: from, lt: to } }, select: { id: true, categoryId: true, amountCents: true, kind: true, status: true, competenceDate: true, dueDate: true } }),
    prisma.financialAccount.findMany({ where: { financialSpaceId: spaceId, archivedAt: null }, select: { id: true, name: true, type: true, balanceCents: true } }),
    prisma.alert.findMany({ where: { financialSpaceId: spaceId } }),
  ]);
  const categoryNames = new Map(categories.map((item) => [item.id, item.name])); const result: StoredAlert[] = [];
  for (const item of budgets.filter((entry) => dateOnly(entry.month)?.startsWith(month))) { const spent = Math.abs(transactions.filter((row) => row.categoryId === item.categoryId && row.kind === "expense" && row.status !== "cancelled").reduce((sum, row) => sum + row.amountCents, 0)); const percentage = item.limitCents > 0 ? Math.round((spent / item.limitCents) * 100) : 0; if (percentage < 80) continue; const name = categoryNames.get(item.categoryId) ?? "Categoria"; const alertId = `budget-${item.id}-${percentage >= 100 ? "100" : "80"}`; const existing = stored.find((row) => row.id === alertId) ?? stored.find((row) => row.title.includes(name)); result.push({ id: alertId, financialSpaceId: spaceId, title: `${name} ${percentage >= 100 ? "estourou" : "em atenção"}`, body: percentage >= 100 ? `Você ultrapassou o orçamento em ${percentage}% neste mês.` : `Você já usou ${percentage}% do orçamento desta categoria.`, severity: percentage >= 100 ? "danger" : "warning", readAt: existing?.readAt ?? null, createdAt: existing?.createdAt ?? new Date(), updatedAt: existing?.updatedAt ?? new Date() }); }
  const today = getBusinessDate(); const todayTime = new Date(`${today}T12:00:00`).getTime();
  for (const item of transactions.filter((entry) => entry.status !== "paid" && entry.status !== "cancelled" && entry.dueDate)) { const dueDate = dateOnly(item.dueDate)!; const days = Math.ceil((new Date(`${dueDate}T12:00:00`).getTime() - todayTime) / 86_400_000); if (days > 5) continue; const existing = stored.find((row) => row.id === `due-${item.id}`); result.push({ id: `due-${item.id}`, financialSpaceId: spaceId, title: days < 0 ? "Vencimento atrasado" : "Vencimento próximo", body: days < 0 ? `O lançamento com vencimento em ${dueDate} está atrasado.` : `O lançamento vence em ${days === 0 ? "hoje" : `${days} dias`}.`, severity: days < 0 ? "danger" : "warning", readAt: existing?.readAt ?? null, createdAt: existing?.createdAt ?? new Date(), updatedAt: existing?.updatedAt ?? new Date() }); }
  for (const account of accounts.filter((item) => item.type !== "credit_card" && item.balanceCents <= 0)) { const existing = stored.find((row) => row.id === `balance-${account.id}`); result.push({ id: `balance-${account.id}`, financialSpaceId: spaceId, title: "Saldo baixo", body: `${account.name} está sem saldo disponível para novas despesas.`, severity: "warning", readAt: existing?.readAt ?? null, createdAt: existing?.createdAt ?? new Date(), updatedAt: existing?.updatedAt ?? new Date() }); }
  if (result.length) await prisma.alert.createMany({ data: result.map(({ id, financialSpaceId, title, body, severity, readAt, createdAt, updatedAt }) => ({ id, financialSpaceId, title, body, severity, readAt, createdAt, updatedAt })), skipDuplicates: true });
  return result.sort((left, right) => Number(Boolean(left.readAt)) - Number(Boolean(right.readAt)));
}
