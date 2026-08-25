"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizationMessage, getCurrentUserId, requireSpaceAccess } from "@/server/auth-context";
import { parseAmountCents } from "@/lib/finance-rules";
const activeSpaceId = "personal-space";

function parseBalanceCents(value: string) {
  const normalized = value.trim().includes(",") ? value.trim().replace(/\./g, "").replace(",", ".") : value.trim();
  if (Number(normalized) === 0) return 0;
  return parseAmountCents(value);
}

const accountSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da conta."),
  bank: z.enum(["Nubank", "Itaú", "Bradesco", "Santander", "Swile", "PicPay", "Inter", "Outro"]).default("Outro"),
  type: z.enum(["checking", "credit_card", "savings", "cash"]),
  balance: z.string().trim().min(1, "Informe um saldo válido."),
  color: z.enum(["lime", "violet", "ocean", "coral", "ink"]).default("lime"),
  closingDay: z.preprocess((value) => value === "" || value == null ? undefined : Number(value), z.number().int().min(1).max(31).optional()),
  dueDay: z.preprocess((value) => value === "" || value == null ? undefined : Number(value), z.number().int().min(1).max(31).optional()),
}).superRefine((value, context) => {
  if (value.type === "credit_card" && value.closingDay === undefined) context.addIssue({ code: "custom", path: ["closingDay"], message: "Informe o dia de fechamento." });
  if (value.type === "credit_card" && value.dueDay === undefined) context.addIssue({ code: "custom", path: ["dueDay"], message: "Informe o dia de vencimento." });
});
const transferSchema = z.object({ spaceId: z.string().min(1), fromId: z.string().min(1, "Selecione a conta de origem."), toId: z.string().min(1, "Selecione a conta de destino."), amount: z.string().trim().min(1, "Informe um valor válido.") }).refine((value) => value.fromId !== value.toId, { path: ["toId"], message: "Escolha uma conta de destino diferente." });
const balanceSchema = z.object({ spaceId: z.string().min(1), accountId: z.string().min(1, "Selecione uma conta."), amount: z.string().trim().min(1, "Informe um valor válido.") });

function readAccount(formData: FormData) {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false as const, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  return { success: true as const, data: parsed.data };
}

export async function createAccount(formData: FormData) {
  const spaceId = String(formData.get("spaceId") ?? activeSpaceId);
  try { await requireSpaceAccess(spaceId, "accounts:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  const result = readAccount(formData);
  if (!result.success) return result;
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("AUTH_REQUIRED");
    const balanceCents = parseBalanceCents(result.data.balance);
    await prisma.financialAccount.create({ data: { id: randomUUID(), financialSpaceId: spaceId, ownerUserId: userId, name: result.data.name, bank: result.data.bank, type: result.data.type, color: result.data.color, balanceCents, closingDay: result.data.type === "credit_card" ? result.data.closingDay : null, dueDay: result.data.type === "credit_card" ? result.data.dueDay : null } });
    revalidatePath("/accounts"); revalidatePath("/");
    return { success: true, message: "Conta adicionada.", fieldErrors: {} };
  } catch { return { success: false, message: "Não foi possível criar a conta.", fieldErrors: {} }; }
}

export async function updateAccount(id: string, formData: FormData) {
  const spaceId = String(formData.get("spaceId") ?? activeSpaceId);
  try { await requireSpaceAccess(spaceId, "accounts:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  const result = readAccount(formData);
  if (!result.success) return result;
  try {
    const balanceCents = parseBalanceCents(result.data.balance);
    const updated = await prisma.financialAccount.updateMany({ where: { id, financialSpaceId: spaceId, archivedAt: null }, data: { name: result.data.name, bank: result.data.bank, type: result.data.type, color: result.data.color, balanceCents, closingDay: result.data.type === "credit_card" ? result.data.closingDay : null, dueDay: result.data.type === "credit_card" ? result.data.dueDay : null, updatedAt: new Date() } });
    if (!updated.count) return { success: false, message: "Conta não encontrada no espaço ativo.", fieldErrors: {} };
    revalidatePath("/accounts"); revalidatePath("/");
    return { success: true, message: "Conta atualizada.", fieldErrors: {} };
  } catch { return { success: false, message: "Não foi possível atualizar a conta.", fieldErrors: {} }; }
}

export async function archiveAccount(id: string, spaceId = activeSpaceId) {
  try { await requireSpaceAccess(spaceId, "accounts:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  try {
    await prisma.financialAccount.updateMany({ where: { id, financialSpaceId: spaceId, archivedAt: null }, data: { archivedAt: new Date(), updatedAt: new Date() } });
    revalidatePath("/accounts"); revalidatePath("/");
    return { success: true, message: "Conta arquivada.", fieldErrors: {} };
  } catch { return { success: false, message: "Não foi possível arquivar a conta.", fieldErrors: {} }; }
}

export async function transferBetweenAccounts(formData: FormData) {
  const parsed = transferSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { spaceId, fromId, toId } = parsed.data;
  try { await requireSpaceAccess(spaceId, "accounts:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  let cents = 0;
  try { cents = parseAmountCents(parsed.data.amount); } catch { return { success: false, message: "Informe um valor válido.", fieldErrors: { amount: ["Informe um valor maior que zero."] } }; }
  try {
    await prisma.$transaction(async (tx) => {
      const accounts = await tx.financialAccount.findMany({ where: { financialSpaceId: spaceId, archivedAt: null, id: { in: [fromId, toId] } } });
      const source = accounts.find((account) => account.id === fromId);
      const destination = accounts.find((account) => account.id === toId);
      if (!source || !destination) throw new Error("As duas contas devem pertencer ao espaço ativo.");
      if (source.balanceCents < cents) throw new Error("Saldo insuficiente.");
      const transferGroupId = randomUUID();
      const competenceDate = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date())}T00:00:00Z`);
      await tx.transaction.createMany({ data: [
        { id: randomUUID(), financialSpaceId: spaceId, accountId: source.id, description: "Transferência para a conta de destino", amountCents: -cents, kind: "transfer", status: "paid", competenceDate, paidAt: new Date(), transferGroupId },
        { id: randomUUID(), financialSpaceId: spaceId, accountId: destination.id, description: "Transferência recebida", amountCents: cents, kind: "transfer", status: "paid", competenceDate, paidAt: new Date(), transferGroupId },
      ] });
      await tx.financialAccount.update({ where: { id: fromId }, data: { balanceCents: { decrement: cents }, updatedAt: new Date() } });
      await tx.financialAccount.update({ where: { id: toId }, data: { balanceCents: { increment: cents }, updatedAt: new Date() } });
    });
    revalidatePath("/accounts"); revalidatePath("/");
    return { success: true, message: "Transferência concluída.", fieldErrors: {} };
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : "Não foi possível transferir.", fieldErrors: {} }; }
}

export async function addBalance(formData: FormData) {
  const parsed = balanceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { spaceId, accountId } = parsed.data;
  try { await requireSpaceAccess(spaceId, "accounts:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  let cents = 0;
  try { cents = parseAmountCents(parsed.data.amount); } catch { return { success: false, message: "Informe um valor válido.", fieldErrors: { amount: ["Informe um valor maior que zero."] } }; }
  try {
    const result = await prisma.financialAccount.updateMany({ where: { id: accountId, financialSpaceId: spaceId, archivedAt: null }, data: { balanceCents: { increment: cents }, updatedAt: new Date() } });
    if (!result.count) return { success: false, message: "Conta não encontrada no espaço ativo.", fieldErrors: {} };
    revalidatePath("/accounts"); revalidatePath("/");
    return { success: true, message: "Saldo adicionado.", fieldErrors: {} };
  } catch { return { success: false, message: "Não foi possível adicionar o saldo.", fieldErrors: {} }; }
}
