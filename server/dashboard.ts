import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { category, financialAccount, transaction } from "@/db/schema";
import { formatBRL } from "@/lib/utils";

const fallback = { balance: 1245000, forecast: 982110, income: 820000, expenses: 268230, pending: 21590, transactions: [{ description: "Salário mensal", category: "Salário", date: "05 ago", amountCents: 820000, kind: "income" }, { description: "Aluguel apartamento", category: "Moradia", date: "08 ago", amountCents: -235000, kind: "expense" }, { description: "Mercado da semana", category: "Alimentação", date: "12 ago", amountCents: -18640, kind: "expense" }, { description: "Combustível", category: "Transporte", date: "14 ago", amountCents: -12000, kind: "expense" }], seeded: false };
export async function getDashboardData() {
  try {
    const [accounts, rows] = await Promise.all([db.select().from(financialAccount).limit(20), db.select({ item: transaction, categoryName: category.name }).from(transaction).leftJoin(category, eq(transaction.categoryId, category.id)).orderBy(desc(transaction.competenceDate)).limit(6)]);
    if (!accounts.length) return fallback;
    const income = rows.filter(({ item }) => item.kind === "income").reduce((sum, { item }) => sum + item.amountCents, 0);
    const expenses = Math.abs(rows.filter(({ item }) => item.kind === "expense" && item.status === "paid").reduce((sum, { item }) => sum + item.amountCents, 0));
    const pending = Math.abs(rows.filter(({ item }) => item.status !== "paid").reduce((sum, { item }) => sum + item.amountCents, 0));
    return { balance: accounts.reduce((sum, item) => sum + item.balanceCents, 0), forecast: accounts.reduce((sum, item) => sum + item.balanceCents, 0) - pending, income, expenses, pending, transactions: rows.map(({ item, categoryName }) => ({ description: item.description, category: categoryName ?? "Sem categoria", date: new Date(`${item.competenceDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""), amountCents: item.amountCents, kind: item.kind })), seeded: true };
  } catch { return fallback; }
}
export { formatBRL };
