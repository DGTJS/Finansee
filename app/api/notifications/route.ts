import { NextResponse } from "next/server";
import { getNotifications } from "@/server/notifications";
import { markSpaceNotificationsRead } from "@/server/notifications";
import { resolveSpaceId } from "@/server/space";
import { getClientKey, RequestLimitError, withRequestLimit } from "@/lib/request-guard";

export async function GET(request: Request) {
  try {
    return await withRequestLimit(getClientKey(request, "api-notifications-read"), async () => { const spaceId = await resolveSpaceId(new URL(request.url).searchParams.get("space") ?? undefined); return NextResponse.json(await getNotifications(spaceId), { headers: { "Cache-Control": "no-store, max-age=0" } }); }, { limit: 60, windowMs: 60_000, concurrency: 6, timeoutMs: 8_000 });
  } catch (error) {
    if (error instanceof RequestLimitError) return NextResponse.json({ message: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return NextResponse.json({ message: "Não foi possível carregar as notificações." }, { status: error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403 });
  }
}

export async function POST(request: Request) {
  try {
    return await withRequestLimit(getClientKey(request, "api-notifications-write"), async () => {
      const body = await request.json().catch(() => ({}));
      const requestedSpace = typeof body?.space === "string" ? body.space : undefined;
      const spaceId = await resolveSpaceId(requestedSpace);
      const count = await markSpaceNotificationsRead(spaceId);
      return NextResponse.json({ success: true, count });
    }, { limit: 20, windowMs: 60_000, concurrency: 3, timeoutMs: 8_000 });
  } catch (error) {
    if (error instanceof RequestLimitError) return NextResponse.json({ message: error.message }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    return NextResponse.json({ message: "Não foi possível atualizar as notificações." }, { status: error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403 });
  }
}
