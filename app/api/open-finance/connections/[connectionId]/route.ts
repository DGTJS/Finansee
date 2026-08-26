import { NextResponse } from "next/server";
import { disconnectOpenFinance } from "@/server/open-finance";

export async function DELETE(request: Request, { params }: { params: Promise<{ connectionId: string }> }) {
  try {
    const spaceId = new URL(request.url).searchParams.get("spaceId");
    const { connectionId } = await params;
    if (!spaceId) return NextResponse.json({ message: "Selecione um espaço financeiro." }, { status: 400 });
    await disconnectOpenFinance(spaceId, connectionId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Não foi possível remover a conexão." }, { status: 500 });
  }
}
