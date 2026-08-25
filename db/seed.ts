import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";

config({ path: ".env.local" });
config();

async function ensureUser(id: string, name: string, email: string, password: string) {
  const user = await prisma.user.upsert({ where: { id }, update: { name, email, emailVerified: true }, create: { id, name, email, emailVerified: true } });
  const passwordHash = await hashPassword(password);
  await prisma.account.upsert({ where: { id: `${id}-credential` }, update: { password: passwordHash }, create: { id: `${id}-credential`, accountId: id, providerId: "credential", userId: id, password: passwordHash } });
  return user;
}

async function main() {
  const diego = await ensureUser("demo-user", "Diego Martins", "demo@finansee.local", "Demo!Finansee2026");
  const raissa = await ensureUser("raissa-demo", "Raissa Martins", "raissa@finansee.local", "Raissa!Finansee2026");
  await prisma.financialSpace.upsert({ where: { id: "personal-space" }, update: { name: "Meu Finansee", ownerId: diego.id }, create: { id: "personal-space", name: "Meu Finansee", ownerId: diego.id } });
  await prisma.financialSpace.upsert({ where: { id: "raissa-space" }, update: { name: "Espaço da Raissa", ownerId: raissa.id }, create: { id: "raissa-space", name: "Espaço da Raissa", ownerId: raissa.id } });
  await prisma.spaceMember.upsert({ where: { id: "member-demo" }, update: { status: "active", role: "owner" }, create: { id: "member-demo", financialSpaceId: "personal-space", userId: diego.id, role: "owner" } });
  await prisma.spaceMember.upsert({ where: { id: "member-raissa" }, update: { status: "active", role: "owner" }, create: { id: "member-raissa", financialSpaceId: "raissa-space", userId: raissa.id, role: "owner" } });
  console.log("Prisma seed concluído. Demo: demo@finansee.local / Demo!Finansee2026");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
