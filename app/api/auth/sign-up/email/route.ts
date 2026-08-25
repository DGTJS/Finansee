import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { getFirstValidationMessage, signUpSchema } from "@/lib/auth-validation";
import { getClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

const { POST: betterAuthPost } = toNextJsHandler(auth);

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 32_000) return NextResponse.json({ message: "Requisição muito grande." }, { status: 413 });
    return await withRequestLimit(getClientKey(request, "auth-sign-up"), async () => {
      let body: unknown;
      try { body = await request.clone().json(); } catch { return NextResponse.json({ message: "Dados inválidos." }, { status: 400 }); }
      const parsed = signUpSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ message: getFirstValidationMessage(parsed.error) }, { status: 400 });
      return betterAuthPost(request);
    }, { limit: 5, windowMs: 60_000, concurrency: 2, timeoutMs: 10_000 });
  } catch (error) {
    if (error instanceof RequestLimitError) return NextResponse.json({ message: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return NextResponse.json({ message: "Não foi possível criar a conta agora." }, { status: 503 });
  }
}
