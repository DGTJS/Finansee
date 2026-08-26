import { NextResponse } from "next/server";
import { listOpenFinance } from "@/server/open-finance";

export async function GET(request: Request) {
  try {
    const spaceId = new URL(request.url).searchParams.get("spaceId");
    if (!spaceId) return NextResponse.json({ message: "Selecione um espaço financeiro." }, { status: 400 });
    return NextResponse.json(await listOpenFinance(spaceId));
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar as conexões bancárias." }, { status: 500 });
  }
}
