type ResetUser = { email: string; name: string };
import { withRequestLimit } from "@/lib/request-guard";

let developmentResetLink = "";

export function getDevelopmentResetLink() {
  const link = developmentResetLink;
  developmentResetLink = "";
  return link;
}

export async function deliverResetPassword({ user, url }: { user: ResetUser; url: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    const response = await withRequestLimit("external:resend:email", () => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [user.email], subject: "Redefina sua senha no Finansee", html: `<p>Olá, ${escapeHtml(user.name)}.</p><p>Use o link abaixo para criar uma nova senha:</p><p><a href="${escapeHtml(url)}">Redefinir minha senha</a></p><p>Este link expira em uma hora.</p>` }),
      signal: AbortSignal.timeout(8_000),
    }), { limit: 20, windowMs: 60_000, concurrency: 2, timeoutMs: 9_000 });
    if (!response.ok) throw new Error("RESET_EMAIL_FAILED");
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    developmentResetLink = url;
    return;
  }
  throw new Error("RESET_EMAIL_NOT_CONFIGURED");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character);
}
