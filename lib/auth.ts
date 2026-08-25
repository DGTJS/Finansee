import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { randomUUID } from "node:crypto";
import { deliverResetPassword } from "@/server/reset-password";
import { passwordSchema } from "@/lib/auth-validation";
import { APIError } from "better-auth";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "finansee-local-development-secret-change-me",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128, sendResetPassword: async ({ user, url }) => deliverResetPassword({ user: { email: user.email, name: user.name }, url }) },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 5 },
    },
  },
  hooks: {
    before: async (context) => {
      const hookContext = context as unknown as { path?: string; body?: { password?: unknown; newPassword?: unknown } };
      if (hookContext.path !== "/sign-up/email" && hookContext.path !== "/reset-password") return;
      const body = hookContext.body ?? {};
      const result = passwordSchema.safeParse(hookContext.path === "/reset-password" ? body.newPassword : body.password);
      if (!result.success) throw APIError.from("BAD_REQUEST", { code: "PASSWORD_TOO_WEAK", message: result.error.issues[0]?.message ?? "Senha inválida." });
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const spaceId = randomUUID();
          await prisma.financialSpace.create({ data: { id: spaceId, name: `Espaço de ${createdUser.name}`, ownerId: createdUser.id, members: { create: { id: randomUUID(), userId: createdUser.id, role: "owner" } }, accounts: { create: { id: randomUUID(), ownerUserId: createdUser.id, name: "Conta principal", type: "checking", balanceCents: 0, color: "lime" } } } });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
