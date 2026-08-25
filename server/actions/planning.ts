"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizationMessage, requireSpaceAccess } from "@/server/auth-context";
import { parseAmountCents } from "@/lib/finance-rules";

const goalSchema = z.object({ spaceId: z.string().min(1), name: z.string().trim().min(2, "Informe o nome da meta."), target: z.string().trim().min(1, "Informe um valor-alvo maior que zero."), current: z.string().trim().min(1, "Informe o valor atual."), dueDate: z.string().optional() });
const budgetSchema = z.object({ spaceId: z.string().min(1), categoryId: z.string().min(1, "Selecione uma categoria."), month: z.string().min(7, "Informe o mês."), limit: z.string().trim().min(1, "Informe um limite maior que zero.") });
const nonNegativeCents = (value: string) => { const normalized = value.trim().includes(",") ? value.trim().replace(/\./g, "").replace(",", ".") : value.trim(); if (Number(normalized) === 0) return 0; return parseAmountCents(value); };
const invalid = (parsed: { error: z.ZodError }) => ({ success: false as const, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors });

export async function createGoal(formData: FormData) {
  const parsed = goalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed);
  try {
    await requireSpaceAccess(parsed.data.spaceId, "planning:write");
    await prisma.goal.create({ data: { id: randomUUID(), financialSpaceId: parsed.data.spaceId, name: parsed.data.name, targetCents: parseAmountCents(parsed.data.target), currentCents: nonNegativeCents(parsed.data.current), dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00Z`) : null } });
    revalidatePath("/planning");
    return { success: true, message: "Meta criada.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível criar a meta.", fieldErrors: {} }; }
}

export async function updateGoal(id: string, formData: FormData) {
  const parsed = goalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed);
  try {
    await requireSpaceAccess(parsed.data.spaceId, "planning:write");
    await prisma.goal.updateMany({ where: { id, financialSpaceId: parsed.data.spaceId }, data: { name: parsed.data.name, targetCents: parseAmountCents(parsed.data.target), currentCents: nonNegativeCents(parsed.data.current), dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00Z`) : null, updatedAt: new Date() } });
    revalidatePath("/planning");
    return { success: true, message: "Meta atualizada.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível atualizar a meta.", fieldErrors: {} }; }
}

export async function deleteGoal(id: string, spaceId: string) {
  try { await requireSpaceAccess(spaceId, "planning:write"); await prisma.goal.deleteMany({ where: { id, financialSpaceId: spaceId } }); revalidatePath("/planning"); return { success: true, message: "Meta removida.", fieldErrors: {} }; }
  catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível remover a meta.", fieldErrors: {} }; }
}

export async function createBudget(formData: FormData) {
  const parsed = budgetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed);
  try {
    await requireSpaceAccess(parsed.data.spaceId, "planning:write");
    const validCategory = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, financialSpaceId: parsed.data.spaceId } });
    if (!validCategory) return { success: false, message: "Categoria inválida para este espaço.", fieldErrors: { categoryId: ["Selecione uma categoria válida."] } };
    const existingBudget = await prisma.budget.findFirst({ where: { financialSpaceId: parsed.data.spaceId, categoryId: parsed.data.categoryId, month: new Date(`${parsed.data.month}-01T00:00:00Z`) } });
    if (existingBudget) return { success: false, message: "Já existe um orçamento para esta categoria neste mês.", fieldErrors: { categoryId: ["Esta categoria já possui orçamento neste mês."] } };
    await prisma.budget.create({ data: { id: randomUUID(), financialSpaceId: parsed.data.spaceId, categoryId: parsed.data.categoryId, month: new Date(`${parsed.data.month}-01T00:00:00Z`), limitCents: parseAmountCents(parsed.data.limit) } });
    revalidatePath("/planning");
    return { success: true, message: "Orçamento criado.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível criar o orçamento.", fieldErrors: {} }; }
}

export async function deleteBudget(id: string, spaceId: string) {
  try { await requireSpaceAccess(spaceId, "planning:write"); await prisma.budget.deleteMany({ where: { id, financialSpaceId: spaceId } }); revalidatePath("/planning"); return { success: true, message: "Orçamento removido.", fieldErrors: {} }; }
  catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível remover o orçamento.", fieldErrors: {} }; }
}

export async function updateBudget(id: string, formData: FormData) {
  const parsed = budgetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed);
  try {
    await requireSpaceAccess(parsed.data.spaceId, "planning:write");
    const validCategory = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, financialSpaceId: parsed.data.spaceId } });
    if (!validCategory) return { success: false, message: "Categoria inválida para este espaço.", fieldErrors: { categoryId: ["Selecione uma categoria válida."] } };
    const existingBudget = await prisma.budget.findFirst({ where: { financialSpaceId: parsed.data.spaceId, categoryId: parsed.data.categoryId, month: new Date(`${parsed.data.month}-01T00:00:00Z`) } });
    if (existingBudget && existingBudget.id !== id) return { success: false, message: "Já existe um orçamento para esta categoria neste mês.", fieldErrors: { categoryId: ["Esta categoria já possui orçamento neste mês."] } };
    await prisma.budget.updateMany({ where: { id, financialSpaceId: parsed.data.spaceId }, data: { categoryId: parsed.data.categoryId, month: new Date(`${parsed.data.month}-01T00:00:00Z`), limitCents: parseAmountCents(parsed.data.limit), updatedAt: new Date() } });
    revalidatePath("/planning");
    return { success: true, message: "Orçamento atualizado.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível atualizar o orçamento.", fieldErrors: {} }; }
}
