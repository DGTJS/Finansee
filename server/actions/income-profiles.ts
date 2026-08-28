"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizationMessage, requireSpaceAccess } from "@/server/auth-context";
import { parseAmountCents } from "@/lib/finance-rules";
import { getBusinessDate, getBusinessMonth } from "@/lib/business-date";

const schema = z.object({ spaceId: z.string().min(1), ownerUserId: z.string().min(1, "Selecione a pessoa."), accountId: z.string().min(1, "Selecione a conta."), name: z.string().trim().min(2, "Informe o nome da renda."), kind: z.enum(["salary", "va", "vr", "benefit"]), amount: z.string().trim().min(1, "Informe um valor maior que zero."), paymentDay: z.coerce.number().int().min(1).max(31) });

export async function createIncomeProfile(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: "Confira os campos obrigatórios.", fieldErrors: parsed.error.flatten().fieldErrors };
  const input = parsed.data;
  try {
    await requireSpaceAccess(input.spaceId, "planning:write");
    const [member, account] = await Promise.all([
      prisma.spaceMember.findFirst({ where: { financialSpaceId: input.spaceId, userId: input.ownerUserId, status: "active" } }),
      prisma.financialAccount.findFirst({ where: { id: input.accountId, financialSpaceId: input.spaceId, archivedAt: null } }),
    ]);
    if (!member || !account) return { success: false, message: "Pessoa ou conta inválida para este espaço.", fieldErrors: {} };
    await prisma.incomeProfile.create({ data: { id: randomUUID(), financialSpaceId: input.spaceId, ownerUserId: input.ownerUserId, accountId: input.accountId, name: input.name, kind: input.kind, amountCents: parseAmountCents(input.amount), paymentDay: input.paymentDay } });
    revalidatePath("/settings");
    return { success: true, message: "Renda cadastrada.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível cadastrar a renda.", fieldErrors: {} }; }
}

export async function deleteIncomeProfile(id: string, spaceId: string) {
  try { await requireSpaceAccess(spaceId, "planning:write"); await prisma.incomeProfile.deleteMany({ where: { id, financialSpaceId: spaceId } }); revalidatePath("/settings"); return { success: true, message: "Renda removida.", fieldErrors: {} }; }
  catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível remover a renda.", fieldErrors: {} }; }
}

export async function updateIncomeProfile(id: string, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: "Confira os campos obrigatórios.", fieldErrors: parsed.error.flatten().fieldErrors };
  const input = parsed.data;
  try {
    await requireSpaceAccess(input.spaceId, "planning:write");
    const [member, account] = await Promise.all([
      prisma.spaceMember.findFirst({ where: { financialSpaceId: input.spaceId, userId: input.ownerUserId, status: "active" } }),
      prisma.financialAccount.findFirst({ where: { id: input.accountId, financialSpaceId: input.spaceId, archivedAt: null } }),
    ]);
    if (!member || !account) return { success: false, message: "Pessoa ou conta inválida para este espaço.", fieldErrors: {} };
    await prisma.incomeProfile.updateMany({ where: { id, financialSpaceId: input.spaceId }, data: { ownerUserId: input.ownerUserId, accountId: input.accountId, name: input.name, kind: input.kind, amountCents: parseAmountCents(input.amount), paymentDay: input.paymentDay, updatedAt: new Date() } });
    revalidatePath("/settings");
    return { success: true, message: "Renda atualizada.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível atualizar a renda.", fieldErrors: {} }; }
}

export async function markIncomeReceived(id: string, spaceId: string) {
  try {
    await requireSpaceAccess(spaceId, "planning:write");
    const month = getBusinessMonth();
    const today = getBusinessDate();
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.incomeProfile.findFirst({ where: { id, financialSpaceId: spaceId, active: true }, select: { id: true, name: true, accountId: true, amountCents: true, lastReceivedMonth: true } });
      if (!profile) throw new Error("INCOME_NOT_FOUND");
      const claimed = await tx.incomeProfile.updateMany({ where: { id: profile.id, financialSpaceId: spaceId, active: true, OR: [{ lastReceivedMonth: null }, { lastReceivedMonth: { not: month } }] }, data: { lastReceivedMonth: month, updatedAt: new Date() } });
      if (!claimed.count) return { alreadyReceived: true, name: profile.name };
      await tx.transaction.create({ data: { id: randomUUID(), financialSpaceId: spaceId, accountId: profile.accountId, description: `${profile.name} · recebido`, source: `income-profile:${profile.id}:${month}`, amountCents: profile.amountCents, kind: "income", status: "paid", competenceDate: new Date(`${today}T00:00:00Z`), paidAt: new Date() } });
      await tx.financialAccount.update({ where: { id: profile.accountId }, data: { balanceCents: { increment: profile.amountCents }, updatedAt: new Date() } });
      return { alreadyReceived: false, name: profile.name };
    });
    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");
    return { success: true, message: result.alreadyReceived ? "Esta renda já foi recebida neste mês." : `Recebimento de ${result.name} registrado.`, fieldErrors: {} };
  } catch (error) {
    const message = error instanceof Error && error.message === "INCOME_NOT_FOUND" ? "Renda não encontrada no espaço ativo." : authorizationMessage(error) ?? "Não foi possível registrar o recebimento.";
    return { success: false, message, fieldErrors: {} };
  }
}
