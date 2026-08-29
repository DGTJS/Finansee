"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizationMessage, getCurrentUserId, requireSpaceAccess } from "@/server/auth-context";
import { parseAmountCents } from "@/lib/finance-rules";

const activeSpaceId = "personal-space";

const transactionSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição."),
  source: z.string().trim().max(120, "A origem deve ter até 120 caracteres.").optional(),
  amount: z.string().trim().min(1, "Informe um valor maior que zero."),
  kind: z.enum(["income", "expense"]),
  categoryId: z.string().min(1),
  accountId: z.string().min(1),
  competenceDate: z.string().length(10, "Informe uma data válida."),
}).superRefine((value, context) => {
  if (value.kind === "income" && !value.source?.trim()) context.addIssue({ code: "custom", path: ["source"], message: "Informe a origem da receita." });
});

export async function createTransaction(formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  const spaceId = String(formData.get("spaceId") ?? "personal-space");
  try { await requireSpaceAccess(spaceId, "transactions:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  const userId = await getCurrentUserId();

  let amountCents = 0;
  try { amountCents = parseAmountCents(parsed.data.amount) * (parsed.data.kind === "expense" ? -1 : 1); } catch { return { success: false, message: "Informe um valor maior que zero.", fieldErrors: { amount: ["Informe um valor maior que zero."] } }; }
  try {
    await prisma.$transaction(async (tx) => {
      const [account, selectedCategory] = await Promise.all([
        tx.financialAccount.findFirst({ where: { id: parsed.data.accountId, financialSpaceId: spaceId, archivedAt: null }, select: { id: true } }),
        tx.category.findFirst({ where: { id: parsed.data.categoryId, financialSpaceId: spaceId }, select: { id: true, kind: true } }),
      ]);
      if (!account || !selectedCategory || selectedCategory.kind !== parsed.data.kind) throw new Error("Conta ou categoria inválida para este espaço.");
      await tx.transaction.create({ data: { id: randomUUID(), financialSpaceId: spaceId, accountId: parsed.data.accountId, categoryId: parsed.data.categoryId, description: parsed.data.description, source: parsed.data.source || null, amountCents, kind: parsed.data.kind, status: "paid", competenceDate: new Date(`${parsed.data.competenceDate}T00:00:00Z`), paidAt: new Date(), createdBy: userId, updatedBy: userId } });
      await tx.financialAccount.update({ where: { id: parsed.data.accountId }, data: { balanceCents: { increment: amountCents }, updatedAt: new Date() } });
    });
    revalidatePath("/");
    return { success: true, message: "Transação adicionada.", fieldErrors: {} };
  } catch {
    return { success: false, message: "Não foi possível salvar. Verifique o banco local.", fieldErrors: {} };
  }
}

export async function updateTransaction(id: string, formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  let amountCents = 0;
  try { amountCents = parseAmountCents(parsed.data.amount) * (parsed.data.kind === "expense" ? -1 : 1); } catch { return { success: false, message: "Informe um valor maior que zero.", fieldErrors: { amount: ["Informe um valor maior que zero."] } }; }
  const spaceId = String(formData.get("spaceId") ?? "personal-space");
  try { await requireSpaceAccess(spaceId, "transactions:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  const userId = await getCurrentUserId();
  try {
    await prisma.$transaction(async (tx) => {
      const [current, account, selectedCategory] = await Promise.all([
        tx.transaction.findFirst({ where: { id, financialSpaceId: spaceId } }),
        tx.financialAccount.findFirst({ where: { id: parsed.data.accountId, financialSpaceId: spaceId, archivedAt: null }, select: { id: true } }),
        tx.category.findFirst({ where: { id: parsed.data.categoryId, financialSpaceId: spaceId }, select: { id: true, kind: true } }),
      ]);
      if (!current || current.status === "cancelled" || !account || !selectedCategory || selectedCategory.kind !== parsed.data.kind) throw new Error("Transação, conta ou categoria inválida para este espaço.");
      if (current.status === "paid") await tx.financialAccount.update({ where: { id: current.accountId }, data: { balanceCents: { decrement: current.amountCents }, updatedAt: new Date() } });
      await tx.transaction.update({ where: { id }, data: { accountId: parsed.data.accountId, categoryId: parsed.data.categoryId, description: parsed.data.description, source: parsed.data.source || null, amountCents, kind: parsed.data.kind, competenceDate: new Date(`${parsed.data.competenceDate}T00:00:00Z`), updatedBy: userId, updatedAt: new Date() } });
      await tx.financialAccount.update({ where: { id: parsed.data.accountId }, data: { balanceCents: { increment: amountCents }, updatedAt: new Date() } });
    });
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/calendar");
    return { success: true, message: "Transação atualizada.", fieldErrors: {} };
  } catch { return { success: false, message: "Não foi possível atualizar a transação.", fieldErrors: {} }; }
}

export async function cancelTransaction(id: string, spaceId = activeSpaceId) {
  try { await requireSpaceAccess(spaceId, "transactions:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  const userId = await getCurrentUserId();
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findFirst({ where: { id, financialSpaceId: spaceId } });
      if (!current || current.status === "cancelled") throw new Error("Transação não encontrada.");
      if (current.status === "paid") await tx.financialAccount.update({ where: { id: current.accountId }, data: { balanceCents: { decrement: current.amountCents }, updatedAt: new Date() } });
      await tx.transaction.update({ where: { id }, data: { status: "cancelled", cancelledBy: userId, updatedBy: userId, updatedAt: new Date() } });
    });
    revalidatePath("/");
    return { success: true, message: "Transação cancelada.", fieldErrors: {} };
  } catch { return { success: false, message: "Não foi possível cancelar a transação.", fieldErrors: {} }; }
}

export async function deleteTransactions(ids: string[], spaceId = activeSpaceId) {
  const parsed = z.array(z.string().min(1)).min(1).max(100).safeParse(ids);
  if (!parsed.success) return { success: false, message: "Selecione ao menos um lançamento.", fieldErrors: {} };
  try { await requireSpaceAccess(spaceId, "transactions:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  try {
    let deleted = 0;
    await prisma.$transaction(async (tx) => {
      const transactions = await tx.transaction.findMany({ where: { id: { in: [...new Set(parsed.data)] }, financialSpaceId: spaceId } });
      for (const current of transactions) {
        if (current.status === "cancelled") {
          await tx.transaction.delete({ where: { id: current.id } });
          deleted += 1;
          continue;
        }
        if (current.status === "paid") await tx.financialAccount.update({ where: { id: current.accountId }, data: { balanceCents: { decrement: current.amountCents }, updatedAt: new Date() } });
        await tx.transaction.delete({ where: { id: current.id } });
        deleted += 1;
      }
    });
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/calendar");
    return { success: true, message: `${deleted} lançamento${deleted === 1 ? " excluído" : "s excluídos"}.`, fieldErrors: {} };
  } catch { return { success: false, message: "Não foi possível excluir os lançamentos selecionados.", fieldErrors: {} }; }
}

export async function setTransactionPayment(id: string, spaceId: string, paid: boolean) {
  try { await requireSpaceAccess(spaceId, "transactions:write"); } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível autorizar a operação.", fieldErrors: {} }; }
  const userId = await getCurrentUserId();
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findFirst({ where: { id, financialSpaceId: spaceId } });
      if (!current || current.status === "cancelled" || current.kind === "transfer") throw new Error("Transação inválida para pagamento.");
      const isPaid = current.status === "paid";
      if (isPaid === paid) return;
      const nextStatus = paid ? "paid" : "pending";
      if (paid) await tx.financialAccount.update({ where: { id: current.accountId }, data: { balanceCents: { increment: current.amountCents }, updatedAt: new Date() } });
      if (!paid) await tx.financialAccount.update({ where: { id: current.accountId }, data: { balanceCents: { decrement: current.amountCents }, updatedAt: new Date() } });
      await tx.transaction.update({ where: { id }, data: { status: nextStatus, paidAt: paid ? new Date() : null, updatedBy: userId, updatedAt: new Date() } });
    });
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/calendar");
    return { success: true, message: paid ? "Pagamento confirmado." : "Pagamento desfeito.", fieldErrors: {} };
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : "Não foi possível atualizar o pagamento.", fieldErrors: {} }; }
}
