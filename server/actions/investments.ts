"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizationMessage, requireSpaceAccess } from "@/server/auth-context";
import { parseAmountCents } from "@/lib/finance-rules";

const positionSchema = z.object({ spaceId: z.string().min(1), symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,10}$/, "Informe um código de ativo válido."), quantity: z.coerce.number().positive("Informe uma quantidade maior que zero."), averagePrice: z.string().trim().min(1, "Informe o preço médio."), acquiredAt: z.string().length(10, "Informe a data de aquisição.") });

export async function createInvestmentPosition(formData: FormData) {
  const parsed = positionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await requireSpaceAccess(parsed.data.spaceId, "planning:write");
    const averagePriceCents = parseAmountCents(parsed.data.averagePrice);
    const quantityMilli = Math.round(parsed.data.quantity * 1000);
    if (!quantityMilli) return { success: false, message: "Informe uma quantidade válida.", fieldErrors: { quantity: ["Informe uma quantidade válida."] } };
    await prisma.investmentPosition.create({ data: { id: randomUUID(), financialSpaceId: parsed.data.spaceId, symbol: parsed.data.symbol, quantityMilli, averagePriceCents, acquiredAt: new Date(`${parsed.data.acquiredAt}T00:00:00Z`) } });
    revalidatePath("/investments");
    return { success: true, message: "Posição adicionada.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível adicionar a posição.", fieldErrors: {} }; }
}

export async function deleteInvestmentPosition(id: string, spaceId: string) {
  try {
    await requireSpaceAccess(spaceId, "planning:write");
    await prisma.investmentPosition.deleteMany({ where: { id, financialSpaceId: spaceId } });
    revalidatePath("/investments");
    return { success: true, message: "Posição removida.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível remover a posição.", fieldErrors: {} }; }
}

export async function updateInvestmentPosition(id: string, formData: FormData) {
  const parsed = positionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await requireSpaceAccess(parsed.data.spaceId, "planning:write");
    const averagePriceCents = parseAmountCents(parsed.data.averagePrice);
    const quantityMilli = Math.round(parsed.data.quantity * 1000);
    if (!quantityMilli) return { success: false, message: "Informe uma quantidade válida.", fieldErrors: { quantity: ["Informe uma quantidade válida."] } };
    await prisma.investmentPosition.updateMany({ where: { id, financialSpaceId: parsed.data.spaceId }, data: { symbol: parsed.data.symbol, quantityMilli, averagePriceCents, acquiredAt: new Date(`${parsed.data.acquiredAt}T00:00:00Z`), updatedAt: new Date() } });
    revalidatePath("/investments");
    return { success: true, message: "Posição atualizada.", fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível atualizar a posição.", fieldErrors: {} }; }
}
