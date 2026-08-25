import { prisma } from "@/lib/prisma";
import { requireSpaceAccess } from "@/server/auth-context";
import { getBusinessMonthRange } from "@/lib/business-date";
import { dateOnly } from "@/lib/prisma-utils";

export async function getReportData(from = getBusinessMonthRange().from, to = getBusinessMonthRange().to, spaceId = "personal-space") {
  await requireSpaceAccess(spaceId, "read");
  const rows = await prisma.transaction.findMany({ where: { financialSpaceId: spaceId, status: "paid", competenceDate: { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T23:59:59Z`) } }, include: { category: { select: { name: true } } }, orderBy: { competenceDate: "desc" } });
  const incomeCents = rows.filter((row) => row.kind === "income").reduce((sum, row) => sum + row.amountCents, 0); const expenseRows = rows.filter((row) => row.kind === "expense"); const expenseCents = expenseRows.reduce((sum, row) => sum + Math.abs(row.amountCents), 0);
  const grouped = new Map<string, number>(); for (const row of expenseRows) grouped.set(row.category?.name ?? "Sem categoria", (grouped.get(row.category?.name ?? "Sem categoria") ?? 0) + Math.abs(row.amountCents));
  const categories = Array.from(grouped, ([name, totalCents]) => ({ name, totalCents })).sort((a, b) => b.totalCents - a.totalCents).slice(0, 6);
  const topExpenses = expenseRows.slice().sort((a, b) => Math.abs(b.amountCents) - Math.abs(a.amountCents)).slice(0, 5).map((row) => ({ id: row.id, description: row.description, amountCents: row.amountCents, competenceDate: dateOnly(row.competenceDate)!, categoryName: row.category?.name ?? null }));
  return { summary: { incomeCents, expenseCents, count: rows.length }, categories, topExpenses, from, to };
}
