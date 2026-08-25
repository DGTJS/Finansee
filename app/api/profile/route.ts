import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/server/auth-context";
import { getAvailableSpaces } from "@/server/space";
import { getClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

export async function GET(request: Request) {
  try {
    return await withRequestLimit(getClientKey(request, "api-profile"), async () => { const userId = await getCurrentUserId(); const profile = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, image: true } }); return profile ? NextResponse.json({ ...profile, spaces: await getAvailableSpaces() }) : NextResponse.json({ message: "Perfil não encontrado." }, { status: 404 }); }, { limit: 60, windowMs: 60_000, concurrency: 6, timeoutMs: 8_000 });
  } catch (error) {
    if (error instanceof RequestLimitError) return NextResponse.json({ message: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }
}
