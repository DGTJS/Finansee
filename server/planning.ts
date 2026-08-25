import { prisma } from "@/lib/prisma";
import { requireSpaceAccess } from "@/server/auth-context";
import { getSpaceAlerts } from "@/server/alerts";
import { dateOnly } from "@/lib/prisma-utils";

export async function getPlanningData(spaceId = "personal-space") {
  await requireSpaceAccess(spaceId, "read");
  const [budgetsRaw, goals, alerts, categories, accounts, recurrencesRaw] = await Promise.all([prisma.budget.findMany({ where: { financialSpaceId: spaceId }, include: { category: { select: { name: true } } }, orderBy: { month: "asc" } }), prisma.goal.findMany({ where: { financialSpaceId: spaceId }, orderBy: { dueDate: "asc" } }), getSpaceAlerts(spaceId), prisma.category.findMany({ where: { financialSpaceId: spaceId }, select: { id: true, name: true }, orderBy: { name: "asc" } }), prisma.financialAccount.findMany({ where: { financialSpaceId: spaceId, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }), prisma.recurrence.findMany({ where: { financialSpaceId: spaceId }, orderBy: { nextDate: "asc" } })]);
  const budgets = budgetsRaw.map(({ category, ...budget }) => ({ ...budget, month: dateOnly(budget.month)!, categoryName: category?.name ?? null })); const recurrences = recurrencesRaw.map(({ startDate, endDate, nextDate, ...recurrence }) => ({ ...recurrence, startDate: dateOnly(startDate)!, endDate: dateOnly(endDate), nextDate: dateOnly(nextDate)! }));
  return { budgets, goals: goals.map((goal) => ({ ...goal, dueDate: dateOnly(goal.dueDate) })), alerts, categories, accounts, recurrences };
}
