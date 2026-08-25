import { prisma } from "@/lib/prisma";

const defaultCategories = [
  ["Moradia", "expense"], ["Alimentação", "expense"], ["Mercado", "expense"], ["Restaurantes", "expense"], ["Transporte", "expense"], ["Combustível", "expense"], ["Saúde", "expense"], ["Farmácia", "expense"], ["Educação", "expense"], ["Trabalho", "expense"], ["Contas e serviços", "expense"], ["Internet e telefone", "expense"], ["Assinaturas", "expense"], ["Compras", "expense"], ["Vestuário", "expense"], ["Lazer", "expense"], ["Viagens", "expense"], ["Pets", "expense"], ["Impostos e taxas", "expense"], ["Seguros", "expense"], ["Dívidas e parcelas", "expense"], ["Doações", "expense"], ["Investimentos", "expense"], ["Tarifas bancárias", "expense"], ["Outros gastos", "expense"], ["Salário", "income"], ["Freelance", "income"], ["Benefícios", "income"], ["Rendimentos", "income"], ["Reembolsos", "income"], ["Vendas", "income"], ["Aluguel recebido", "income"], ["Prêmios e bônus", "income"], ["Outros recebimentos", "income"],
] as const;

export async function ensureDefaultCategories(spaceId: string) {
  const existing = await prisma.category.findMany({ where: { financialSpaceId: spaceId }, select: { name: true, kind: true } });
  const existingKeys = new Set(existing.map((category) => `${category.kind}:${category.name}`));
  const missing = defaultCategories.filter(([name, kind]) => !existingKeys.has(`${kind}:${name}`));
  if (!missing.length) return;
  await prisma.category.createMany({ data: missing.map(([name, kind], index) => ({ id: `${spaceId}-default-category-${index}`, financialSpaceId: spaceId, name, kind, color: kind === "income" ? "lime" : "ink" })), skipDuplicates: true });
}
