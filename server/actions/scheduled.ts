"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseAmountCents, splitInstallments } from "@/lib/finance-rules";
import { authorizationMessage, getCurrentUserId, requireSpaceAccess } from "@/server/auth-context";

const optionalDate = z.preprocess((value) => value === "" ? undefined : value, z.string().length(10).optional());

const scheduledSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição."),
  source: z.string().trim().max(120).optional(),
  amount: z.string().trim().min(1, "Informe um valor maior que zero."),
  kind: z.enum(["income", "expense"]),
  categoryId: z.string().min(1),
  accountId: z.string().min(1),
  competenceDate: z.string().length(10),
  dueDate: optionalDate,
  installments: z.coerce.number().int().min(2).max(60),
}).superRefine((value, context) => {
  if (value.kind === "income" && !value.source?.trim()) context.addIssue({ code: "custom", path: ["source"], message: "Informe a origem da receita." });
});

const recurrenceSchema = scheduledSchema.omit({ installments: true }).extend({ frequency: z.enum(["monthly", "weekly"]), endDate: optionalDate }).superRefine((value, context) => {
  if (value.endDate && value.endDate < value.competenceDate) context.addIssue({ code: "custom", path: ["endDate"], message: "A data final não pode ser anterior à data inicial." });
});

function validationResult(error: z.ZodError) {
  return { success: false as const, message: error.issues[0]?.message ?? "Confira os campos.", fieldErrors: error.flatten().fieldErrors };
}

function amountCents(value: string, kind: "income" | "expense") {
  return parseAmountCents(value) * (kind === "expense" ? -1 : 1);
}

function addMonths(dateValue: string, amount: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setMonth(date.getMonth() + amount);
  return date.toISOString().slice(0, 10);
}

function addWeeks(dateValue: string, amount: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + amount * 7);
  return date.toISOString().slice(0, 10);
}

async function validateSource(spaceId: string, accountId: string, categoryId: string, kind: string) {
  const [account, selectedCategory] = await Promise.all([
    prisma.financialAccount.findFirst({ where: { id: accountId, financialSpaceId: spaceId, archivedAt: null }, select: { id: true } }),
    prisma.category.findFirst({ where: { id: categoryId, financialSpaceId: spaceId }, select: { id: true, kind: true } }),
  ]);
  if (!account || !selectedCategory || selectedCategory.kind !== kind) throw new Error("Conta ou categoria inválida para este espaço.");
}

export async function createInstallmentPlan(formData: FormData) {
  const parsed = scheduledSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return validationResult(parsed.error);
  const spaceId = String(formData.get("spaceId") ?? "personal-space");
  try {
    await requireSpaceAccess(spaceId, "transactions:write");
    const userId = await getCurrentUserId();
    const totalCents = amountCents(parsed.data.amount, parsed.data.kind);
    const values = splitInstallments(Math.abs(totalCents), parsed.data.installments).map((value) => parsed.data.kind === "expense" ? -value : value);
    await prisma.$transaction(async (tx) => {
      const [account, selectedCategory] = await Promise.all([
        tx.financialAccount.findFirst({ where: { id: parsed.data.accountId, financialSpaceId: spaceId, archivedAt: null }, select: { id: true } }),
        tx.category.findFirst({ where: { id: parsed.data.categoryId, financialSpaceId: spaceId }, select: { id: true, kind: true } }),
      ]);
      if (!account || !selectedCategory || selectedCategory.kind !== parsed.data.kind) throw new Error("Conta ou categoria inválida para este espaço.");
      const groupId = randomUUID();
      await tx.installmentGroup.create({ data: { id: groupId, financialSpaceId: spaceId, totalCents, installmentCount: parsed.data.installments, description: parsed.data.description } });
      for (let index = 0; index < values.length; index += 1) {
        const competenceDate = addMonths(parsed.data.competenceDate, index);
        const dueDate = parsed.data.dueDate ? addMonths(parsed.data.dueDate, index) : competenceDate;
        await tx.transaction.create({ data: { id: randomUUID(), financialSpaceId: spaceId, accountId: parsed.data.accountId, categoryId: parsed.data.categoryId, installmentGroupId: groupId, installmentNumber: index + 1, installmentCount: parsed.data.installments, description: `${parsed.data.description} (${index + 1}/${parsed.data.installments})`, source: parsed.data.source || null, amountCents: values[index], kind: parsed.data.kind, status: "pending", competenceDate: new Date(`${competenceDate}T00:00:00Z`), dueDate: new Date(`${dueDate}T00:00:00Z`), createdBy: userId, updatedBy: userId } });
      }
    });
    revalidatePath("/"); revalidatePath("/transactions"); revalidatePath("/calendar");
    return { success: true, message: "Parcelamento criado.", fieldErrors: {} };
  } catch (error) {
    return { success: false, message: authorizationMessage(error) ?? "Não foi possível criar o parcelamento.", fieldErrors: {} };
  }
}

export async function createRecurrence(formData: FormData) {
  const parsed = recurrenceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return validationResult(parsed.error);
  const spaceId = String(formData.get("spaceId") ?? "personal-space");
  try {
    await requireSpaceAccess(spaceId, "transactions:write");
    await validateSource(spaceId, parsed.data.accountId, parsed.data.categoryId, parsed.data.kind);
    await prisma.recurrence.create({ data: { id: randomUUID(), financialSpaceId: spaceId, accountId: parsed.data.accountId, categoryId: parsed.data.categoryId, description: parsed.data.description, source: parsed.data.source || null, amountCents: amountCents(parsed.data.amount, parsed.data.kind), kind: parsed.data.kind, frequency: parsed.data.frequency, startDate: new Date(`${parsed.data.competenceDate}T00:00:00Z`), endDate: parsed.data.endDate ? new Date(`${parsed.data.endDate}T00:00:00Z`) : null, nextDate: new Date(`${parsed.data.competenceDate}T00:00:00Z`), active: true } });
    revalidatePath("/planning"); revalidatePath("/calendar");
    return { success: true, message: "Recorrência criada.", fieldErrors: {} };
  } catch (error) {
    return { success: false, message: authorizationMessage(error) ?? "Não foi possível criar a recorrência.", fieldErrors: {} };
  }
}

export async function generateRecurringOccurrences(recurrenceId: string, untilDate?: string) {
  try {
    const source = await prisma.recurrence.findUnique({ where: { id: recurrenceId } });
    if (!source) return { success: false, message: "Recorrência não encontrada.", fieldErrors: {} };
    if (!source.active) return { success: false, message: "A recorrência está pausada.", fieldErrors: {} };
    await requireSpaceAccess(source.financialSpaceId, "transactions:write");
    const userId = await getCurrentUserId();
    const targetDate = untilDate ?? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + 31 * 86_400_000));
    await prisma.$transaction(async (tx) => {
      let currentDate = source.nextDate.toISOString().slice(0, 10);
      while (currentDate <= targetDate && (!source.endDate || currentDate <= source.endDate.toISOString().slice(0, 10))) {
        await tx.transaction.createMany({ data: [{ id: randomUUID(), financialSpaceId: source.financialSpaceId, accountId: source.accountId, categoryId: source.categoryId, recurrenceId: source.id, description: source.description, source: source.source, amountCents: source.amountCents, kind: source.kind, status: "pending", competenceDate: new Date(`${currentDate}T00:00:00Z`), dueDate: new Date(`${currentDate}T00:00:00Z`), createdBy: userId, updatedBy: userId }], skipDuplicates: true });
        currentDate = source.frequency === "weekly" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1);
      }
      await tx.recurrence.update({ where: { id: source.id }, data: { nextDate: new Date(`${currentDate}T00:00:00Z`), updatedAt: new Date() } });
    });
    revalidatePath("/"); revalidatePath("/transactions"); revalidatePath("/calendar");
    return { success: true, message: "Ocorrências atualizadas.", fieldErrors: {} };
  } catch (error) {
    return { success: false, message: authorizationMessage(error) ?? "Não foi possível gerar as ocorrências.", fieldErrors: {} };
  }
}

export async function setRecurrenceActive(recurrenceId: string, active: boolean) {
  try {
    const source = await prisma.recurrence.findUnique({ where: { id: recurrenceId }, select: { id: true, financialSpaceId: true } });
    if (!source) return { success: false, message: "Recorrência não encontrada.", fieldErrors: {} };
    await requireSpaceAccess(source.financialSpaceId, "transactions:write");
    await prisma.recurrence.updateMany({ where: { id: recurrenceId, financialSpaceId: source.financialSpaceId }, data: { active, updatedAt: new Date() } });
    revalidatePath("/planning");
    return { success: true, message: active ? "Recorrência reativada." : "Recorrência pausada.", fieldErrors: {} };
  } catch (error) {
    return { success: false, message: authorizationMessage(error) ?? "Não foi possível alterar a recorrência.", fieldErrors: {} };
  }
}
