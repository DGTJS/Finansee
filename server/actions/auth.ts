"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDevelopmentResetLink } from "@/server/reset-password";
import { getHeaderClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

const resetRequestSchema = z.object({ email: z.string().trim().email("Informe um e-mail válido.") });

export async function requestPasswordReset(formData: FormData) {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Informe um e-mail válido.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await withRequestLimit(await getHeaderClientKey("password-reset", parsed.data.email.toLowerCase()), async () => auth.api.requestPasswordReset({ body: { email: parsed.data.email, redirectTo: "/reset-password" }, headers: await headers() }), { limit: 3, windowMs: 15 * 60_000, concurrency: 1, timeoutMs: 10_000 });
    const developmentLink = process.env.NODE_ENV !== "production" ? getDevelopmentResetLink() : "";
    return { success: true, message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.", developmentLink, fieldErrors: {} };
  } catch (error) {
    if (error instanceof RequestLimitError) return { success: false, message: error.message, fieldErrors: {} };
    return { success: false, message: "Não foi possível iniciar a recuperação agora.", fieldErrors: {} };
  }
}
