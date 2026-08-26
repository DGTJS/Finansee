import { NextResponse } from "next/server";
import { syncOpenFinance } from "@/server/open-finance";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { spaceId?: string; itemId?: string };
    if (!body.spaceId || !body.itemId) return NextResponse.json({ message: "Dados da conexão incompletos." }, { status: 400 });
    await syncOpenFinance(body.spaceId, body.itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível sincronizar." }, { status: 500 });
  }
}
