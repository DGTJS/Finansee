import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/server/auth-context";
import { getClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

const themes = new Set(["default", "black-white", "black-red", "white-black", "black-green", "black-blue"]);
const modes = new Set(["light", "dark"]);

export async function PATCH(request: Request) {
  try {
    return await withRequestLimit(getClientKey(request, "api-theme-write"), async () => {
      const body = await request.json().catch(() => ({}));
      if (typeof body?.theme !== "string" || !themes.has(body.theme) || typeof body?.mode !== "string" || !modes.has(body.mode)) return NextResponse.json({ message: "Preferência de tema inválida." }, { status: 400 });
      const userId = await getCurrentUserId();
      await prisma.user.update({ where: { id: userId }, data: { themeId: body.theme, themeMode: body.mode, updatedAt: new Date() } });
      return NextResponse.json({ success: true });
    }, { limit: 30, windowMs: 60_000, concurrency: 3, timeoutMs: 8_000 });
  } catch (error) {
    if (error instanceof RequestLimitError) return NextResponse.json({ message: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return NextResponse.json({ message: "Não foi possível salvar o tema." }, { status: error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 500 });
  }
}
