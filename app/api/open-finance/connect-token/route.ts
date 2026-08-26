import { NextResponse } from "next/server";
import { createConnectToken, PluggyError } from "@/server/pluggy";
import { getCurrentUserId, requireSpaceAccess } from "@/server/auth-context";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { spaceId?: string };
    if (!body.spaceId) return NextResponse.json({ message: "Selecione um espaço financeiro." }, { status: 400 });
    await requireSpaceAccess(body.spaceId, "accounts:write");
    const token = await createConnectToken(await getCurrentUserId());
    return NextResponse.json({ accessToken: token.accessToken });
  } catch (error) {
    const status = error instanceof PluggyError && error.status === 429 ? 429 : 500;
    return NextResponse.json({ message: error instanceof Error && error.message === "PLUGGY_NOT_CONFIGURED" ? "A integração bancária ainda não foi configurada." : "Não foi possível iniciar a conexão bancária." }, { status });
  }
}
