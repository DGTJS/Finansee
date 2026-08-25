import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { getClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

const betterAuthHandler = toNextJsHandler(auth);
const handlers = { GET: betterAuthHandler.GET, POST: betterAuthHandler.POST, DELETE: betterAuthHandler.DELETE, PATCH: betterAuthHandler.PATCH, PUT: betterAuthHandler.PUT };

async function guarded(request: Request, method: keyof typeof handlers) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 64_000) return NextResponse.json({ message: "Requisição muito grande." }, { status: 413 });
    return await withRequestLimit(getClientKey(request, `auth-${method}`), () => handlers[method](request), { limit: method === "GET" ? 120 : 30, windowMs: 60_000, concurrency: method === "GET" ? 12 : 4, timeoutMs: 10_000 });
  } catch (error) {
    if (error instanceof RequestLimitError) return NextResponse.json({ message: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return NextResponse.json({ message: "Não foi possível processar a autenticação agora." }, { status: 503 });
  }
}

export const GET = (request: Request) => guarded(request, "GET");
export const POST = (request: Request) => guarded(request, "POST");
export const DELETE = (request: Request) => guarded(request, "DELETE");
export const PATCH = (request: Request) => guarded(request, "PATCH");
export const PUT = (request: Request) => guarded(request, "PUT");
