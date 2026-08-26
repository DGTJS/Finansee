"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { verifyPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { authorizationMessage, getAuthContext, getCurrentUserId, requireSpaceAccess } from "@/server/auth-context";
import { passwordSchema as securePasswordSchema } from "@/lib/auth-validation";
import { getHeaderClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

const profileSchema = z.object({ spaceId: z.string().min(1), name: z.string().trim().min(2, "Informe seu nome."), email: z.string().trim().email("Informe um e-mail válido."), image: z.string().max(900_000).optional() });
const passwordSchema = z.object({ currentPassword: z.string().min(1, "Informe sua senha atual."), newPassword: securePasswordSchema, confirmation: z.string().min(1, "Confirme a nova senha.") }).refine((data) => data.newPassword === data.confirmation, { path: ["confirmation"], message: "As senhas não conferem." });
const invitationSchema = z.object({ spaceId: z.string().min(1), email: z.string().trim().email("Informe um e-mail válido."), role: z.enum(["member", "viewer"]) });
const participantSchema = z.object({ spaceId: z.string().min(1), name: z.string().trim().min(2, "Informe o nome do participante.").max(100, "O nome é muito longo."), email: z.string().trim().email("Informe um e-mail válido.").max(254, "O e-mail é muito longo."), password: securePasswordSchema, confirmation: z.string().min(1, "Confirme a senha.") }).refine((data) => data.password === data.confirmation, { path: ["confirmation"], message: "As senhas não conferem." });
const deleteSchema = z.object({ spaceId: z.string().min(1), currentPassword: z.string().min(1, "Informe sua senha atual."), confirmation: z.literal("EXCLUIR", { error: "Digite EXCLUIR para confirmar." }) });
const permissionField = z.preprocess((value) => value === true || value === "true", z.boolean()).default(false);
const memberSchema = z.object({ spaceId: z.string().min(1), memberId: z.string().min(1), role: z.enum(["admin", "member", "viewer"]), status: z.enum(["active", "removed"]), transactions: permissionField, accounts: permissionField, planning: permissionField });
const invitationAcceptanceSchema = z.object({ token: z.string().trim().min(32, "Convite inválido.") });
function invalid(error: z.ZodError) { return { success: false as const, message: error.issues[0]?.message ?? "Confira os campos.", fieldErrors: error.flatten().fieldErrors }; }

type SpaceTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function ensurePersonalSpace(tx: SpaceTransaction, userId: string, userName: string) {
  const personal = await tx.financialSpace.findFirst({
    where: { members: { every: { userId, status: "active" } } },
    include: { members: { select: { userId: true, status: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (personal && personal.members.length === 1) return personal.id;

  const id = randomUUID();
  await tx.financialSpace.create({ data: { id, name: `Conta de ${userName.trim()}`, ownerId: userId } });
  await tx.spaceMember.create({ data: { id: randomUUID(), financialSpaceId: id, userId, role: "owner", status: "active" } });
  return id;
}

async function ensureJointSpace(tx: SpaceTransaction, sourceSpaceId: string, inviterId: string, invitedUserId: string, invitedRole: string, inviterName: string, invitedName: string) {
  const existing = await tx.financialSpace.findFirst({
    where: {
      members: { some: { userId: inviterId, status: "active" } },
      AND: { members: { some: { userId: invitedUserId, status: "active" } } },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const source = await tx.financialSpace.findUnique({ where: { id: sourceSpaceId }, include: { members: { where: { status: "active" }, select: { userId: true } } } });
  if (!source) throw new Error("SPACE_NOT_FOUND");

  if (source.members.length > 1) {
    await tx.spaceMember.create({ data: { id: randomUUID(), financialSpaceId: source.id, userId: invitedUserId, role: invitedRole, status: "active", permissions: { read: true, "transactions:write": invitedRole === "member" } } });
    return source.id;
  }

  const id = randomUUID();
  await tx.financialSpace.create({ data: { id, name: `${inviterName.trim()} & ${invitedName.trim()}`, ownerId: inviterId } });
  await tx.spaceMember.createMany({ data: [
    { id: randomUUID(), financialSpaceId: id, userId: inviterId, role: "owner", status: "active" },
    { id: randomUUID(), financialSpaceId: id, userId: invitedUserId, role: invitedRole, status: "active", permissions: { read: true, "transactions:write": invitedRole === "member" } },
  ] });
  return id;
}

export async function updateProfile(formData: FormData) {
  const imageEntry = formData.get("imageFile"); let uploadedImage: string | null = null;
  if (imageEntry && typeof imageEntry === "object" && "arrayBuffer" in imageEntry && "type" in imageEntry && "size" in imageEntry) { const upload = imageEntry as { arrayBuffer: () => Promise<ArrayBuffer>; type: string; size: number }; if (!["image/jpeg", "image/png", "image/webp"].includes(upload.type)) return { success: false, message: "Escolha uma imagem JPG, PNG ou WebP.", fieldErrors: { imageFile: ["Formato de imagem não aceito."] } }; if (upload.size > 512_000) return { success: false, message: "A foto deve ter no máximo 500 KB.", fieldErrors: { imageFile: ["A imagem é muito grande."] } }; uploadedImage = `data:${upload.type};base64,${Buffer.from(await upload.arrayBuffer()).toString("base64")}`; }
  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return invalid(parsed.error);
  try { await requireSpaceAccess(parsed.data.spaceId, "read"); const userId = await getCurrentUserId(); const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } }); await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name, email: parsed.data.email, image: uploadedImage ?? currentUser?.image ?? null, updatedAt: new Date() } }); revalidatePath("/"); revalidatePath("/settings"); return { success: true, message: "Perfil atualizado.", fieldErrors: {} }; } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível atualizar o perfil.", fieldErrors: {} }; }
}

export async function changePassword(formData: FormData) { const parsed = passwordSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return invalid(parsed.error); try { const userId = await getCurrentUserId(); await withRequestLimit(await getHeaderClientKey("change-password", userId), async () => auth.api.changePassword({ body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true }, headers: await headers() }), { limit: 5, windowMs: 15 * 60_000, concurrency: 1, timeoutMs: 10_000 }); return { success: true, message: "Senha atualizada.", fieldErrors: {} }; } catch (error) { if (error instanceof RequestLimitError) return { success: false, message: error.message, fieldErrors: {} }; return { success: false, message: "Senha atual inválida ou não foi possível atualizar.", fieldErrors: {} }; } }

export async function createInvitation(formData: FormData) { const parsed = invitationSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return invalid(parsed.error); try { await requireSpaceAccess(parsed.data.spaceId, "accounts:write"); const inviterId = await getCurrentUserId(); const rawToken = randomBytes(32).toString("hex"); await prisma.spaceInvitation.create({ data: { id: randomUUID(), financialSpaceId: parsed.data.spaceId, email: parsed.data.email, role: parsed.data.role, tokenHash: createHash("sha256").update(rawToken).digest("hex"), invitedBy: inviterId, expiresAt: new Date(Date.now() + 7 * 86400000) } }); return { success: true, message: "Convite criado. Compartilhe o link com a pessoa convidada.", data: { inviteUrl: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/invite?token=${rawToken}` }, fieldErrors: {} }; } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível criar o convite.", fieldErrors: {} }; } }

export async function createParticipantAccount(formData: FormData) {
  const parsed = participantSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await requireSpaceAccess(parsed.data.spaceId, "accounts:write");
    const inviterId = await getCurrentUserId();
    const result = await auth.api.signUpEmail({ body: { name: parsed.data.name, email: parsed.data.email.toLowerCase(), password: parsed.data.password }, headers: await headers() });
    if (!result.user) throw new Error("ACCOUNT_CREATE_FAILED");
    await prisma.$transaction(async (tx) => {
      const inviter = await tx.user.findUniqueOrThrow({ where: { id: inviterId }, select: { name: true } });
      await ensurePersonalSpace(tx, inviterId, inviter.name);
      await ensurePersonalSpace(tx, result.user.id, parsed.data.name);
      await ensureJointSpace(tx, parsed.data.spaceId, inviterId, result.user.id, "member", inviter.name, parsed.data.name);
    });
    revalidatePath("/", "layout");
    revalidatePath("/settings");
    return { success: true, message: "Participante criado. As contas individuais foram preservadas e a conta conjunta está disponível.", fieldErrors: {} };
  } catch (error) {
    const message = error instanceof Error && /already|exist|unique/i.test(error.message) ? "Este e-mail já está cadastrado." : authorizationMessage(error) ?? "Não foi possível criar o participante.";
    return { success: false, message, fieldErrors: {} };
  }
}

export async function updateMemberAccess(formData: FormData) { const parsed = memberSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return invalid(parsed.error); try { const membership = await requireSpaceAccess(parsed.data.spaceId, "accounts:write"); if (membership && !["owner", "admin"].includes(membership.role)) throw new Error("FORBIDDEN"); const target = await prisma.spaceMember.findFirst({ where: { id: parsed.data.memberId, financialSpaceId: parsed.data.spaceId }, select: { id: true, role: true } }); if (!target || target.role === "owner") return { success: false, message: "O proprietário não pode ser alterado por este fluxo.", fieldErrors: {} }; await prisma.spaceMember.update({ where: { id: target.id }, data: { role: parsed.data.role, status: parsed.data.status, permissions: { read: true, "transactions:write": parsed.data.transactions, "accounts:write": parsed.data.accounts, "planning:write": parsed.data.planning }, updatedAt: new Date() } }); revalidatePath("/", "layout"); revalidatePath("/settings"); return { success: true, message: "Acesso do membro atualizado.", fieldErrors: {} }; } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível atualizar o membro.", fieldErrors: {} }; } }

export async function acceptInvitation(formData: FormData) { const parsed = invitationAcceptanceSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return invalid(parsed.error); try { const context = await getAuthContext(); if (!context) throw new Error("AUTH_REQUIRED"); const invitation = await prisma.spaceInvitation.findFirst({ where: { tokenHash: createHash("sha256").update(parsed.data.token).digest("hex"), expiresAt: { gt: new Date() } } }); if (!invitation || invitation.acceptedAt) return { success: false, message: "Este convite expirou ou já foi utilizado.", fieldErrors: {} }; if (context.user.email.toLowerCase() !== invitation.email.toLowerCase()) return { success: false, message: "Este convite foi enviado para outro e-mail.", fieldErrors: {} }; await prisma.$transaction(async (tx) => { const inviter = await tx.user.findUniqueOrThrow({ where: { id: invitation.invitedBy }, select: { id: true, name: true } }); const invitee = await tx.user.findUniqueOrThrow({ where: { id: context.user.id }, select: { name: true } }); await ensurePersonalSpace(tx, inviter.id, inviter.name); await ensurePersonalSpace(tx, context.user.id, invitee.name); await ensureJointSpace(tx, invitation.financialSpaceId, inviter.id, context.user.id, invitation.role, inviter.name, invitee.name); await tx.spaceInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date(), updatedAt: new Date() } }); }); revalidatePath("/", "layout"); revalidatePath("/settings"); return { success: true, message: "Convite aceito. As contas individuais foram preservadas e a conta conjunta está disponível.", fieldErrors: {} }; } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível aceitar o convite.", fieldErrors: {} }; } }

export async function deleteAccount(formData: FormData) { const parsed = deleteSchema.safeParse(Object.fromEntries(formData.entries())); if (!parsed.success) return invalid(parsed.error); try { await requireSpaceAccess(parsed.data.spaceId, "accounts:write"); const userId = await getCurrentUserId(); const credential = await prisma.account.findFirst({ where: { userId, providerId: "credential" }, select: { password: true } }); if (!credential?.password || !(await verifyPassword({ hash: credential.password, password: parsed.data.currentPassword }))) throw new Error("INVALID_PASSWORD"); const ownedSpaceIds = (await prisma.financialSpace.findMany({ where: { ownerId: userId }, select: { id: true } })).map((space) => space.id); await prisma.$transaction(async (tx) => { await tx.financialAccount.updateMany({ where: { ownerUserId: userId }, data: { ownerUserId: null } }); await tx.transaction.updateMany({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }, { cancelledBy: userId }] }, data: { createdBy: null, updatedBy: null, cancelledBy: null } }); await tx.spaceInvitation.deleteMany({ where: { invitedBy: userId } }); await tx.incomeProfile.deleteMany({ where: { ownerUserId: userId } }); if (ownedSpaceIds.length) { const where = { financialSpaceId: { in: ownedSpaceIds } }; await tx.transaction.deleteMany({ where }); await tx.recurrence.deleteMany({ where }); await tx.installmentGroup.deleteMany({ where }); await tx.budget.deleteMany({ where }); await tx.goal.deleteMany({ where }); await tx.alert.deleteMany({ where }); await tx.category.deleteMany({ where }); await tx.financialAccount.deleteMany({ where }); await tx.spaceInvitation.deleteMany({ where }); await tx.spaceMember.deleteMany({ where }); await tx.financialSpace.deleteMany({ where: { id: { in: ownedSpaceIds } } }); } await tx.spaceMember.deleteMany({ where: { userId } }); await tx.user.delete({ where: { id: userId } }); }); return { success: true, message: "Conta excluída.", fieldErrors: {} }; } catch (error) { const invalidPassword = error instanceof Error && error.message === "INVALID_PASSWORD"; return { success: false, message: invalidPassword ? "Senha atual inválida." : authorizationMessage(error) ?? "Não foi possível excluir a conta.", fieldErrors: invalidPassword ? { currentPassword: ["Senha atual inválida."] } : {} }; } }
