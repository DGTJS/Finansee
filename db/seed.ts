import "dotenv/config";
import { randomUUID } from "node:crypto";
import { db, pool } from ".";
import { alert, category, financialAccount, financialSpace, goal, transaction, user, spaceMember } from "./schema";

const now = new Date();
const userId = "demo-user";
const spaceId = "personal-space";
const checkingId = "account-checking";
const cardId = "account-card";
const salaryId = "category-salary";
const homeId = "category-home";
const foodId = "category-food";
const transportId = "category-transport";

await db.insert(user).values({ id: userId, name: "Diego Martins", email: "demo@finansee.local", emailVerified: true }).onConflictDoNothing();
await db.insert(financialSpace).values({ id: spaceId, name: "Meu Finansee", ownerId: userId }).onConflictDoNothing();
await db.insert(spaceMember).values({ id: "member-demo", financialSpaceId: spaceId, userId, role: "owner" }).onConflictDoNothing();
await db.insert(financialAccount).values([
  { id: checkingId, financialSpaceId: spaceId, name: "Conta principal", type: "checking", balanceCents: 1245000, color: "lime" },
  { id: cardId, financialSpaceId: spaceId, name: "Cartão Nubank", type: "credit_card", balanceCents: -218900, color: "violet" },
]).onConflictDoNothing();
await db.insert(category).values([
  { id: salaryId, financialSpaceId: spaceId, name: "Salário", kind: "income", color: "lime" },
  { id: homeId, financialSpaceId: spaceId, name: "Moradia", kind: "expense", color: "orange" },
  { id: foodId, financialSpaceId: spaceId, name: "Alimentação", kind: "expense", color: "blue" },
  { id: transportId, financialSpaceId: spaceId, name: "Transporte", kind: "expense", color: "pink" },
]).onConflictDoNothing();
const transactions = [
  { id: randomUUID(), financialSpaceId: spaceId, accountId: checkingId, categoryId: salaryId, description: "Salário mensal", amountCents: 820000, kind: "income", status: "paid", competenceDate: "2026-08-05", paidAt: now },
  { id: randomUUID(), financialSpaceId: spaceId, accountId: checkingId, categoryId: homeId, description: "Aluguel apartamento", amountCents: -235000, kind: "expense", status: "paid", competenceDate: "2026-08-08", paidAt: now },
  { id: randomUUID(), financialSpaceId: spaceId, accountId: cardId, categoryId: foodId, description: "Mercado da semana", amountCents: -18640, kind: "expense", status: "paid", competenceDate: "2026-08-12", paidAt: now },
  { id: randomUUID(), financialSpaceId: spaceId, accountId: cardId, categoryId: transportId, description: "Combustível", amountCents: -12000, kind: "expense", status: "paid", competenceDate: "2026-08-14", paidAt: now },
  { id: randomUUID(), financialSpaceId: spaceId, accountId: checkingId, categoryId: homeId, description: "Energia elétrica", amountCents: -12690, kind: "expense", status: "pending", competenceDate: "2026-08-20", dueDate: "2026-08-20" },
  { id: randomUUID(), financialSpaceId: spaceId, accountId: checkingId, categoryId: foodId, description: "Restaurante quinta", amountCents: -8900, kind: "expense", status: "pending", competenceDate: "2026-08-22", dueDate: "2026-08-22" },
];
for (const item of transactions) await db.insert(transaction).values(item).onConflictDoNothing();
await db.insert(goal).values({ id: "goal-trip", financialSpaceId: spaceId, name: "Viagem de fim de ano", targetCents: 1200000, currentCents: 742000, dueDate: "2026-12-15" }).onConflictDoNothing();
await db.insert(alert).values({ id: "alert-budget", financialSpaceId: spaceId, title: "Alimentação em atenção", body: "Você já usou 78% do orçamento desta categoria.", severity: "warning" }).onConflictDoNothing();
await pool.end();
