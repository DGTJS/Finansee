export type InvestmentCategory = "Todos" | "Ações" | "ETFs" | "Renda fixa";

export type InvestmentProduct = {
  symbol: string;
  name: string;
  shortName: string;
  category: Exclude<InvestmentCategory, "Todos">;
  description: string;
  risk: "Conservador" | "Moderado" | "Arrojado";
  minimumCents: number;
  accent: string;
  icon: string;
};

export const investmentProducts: InvestmentProduct[] = [
  { symbol: "CDB001", name: "CDB liquidez diária", shortName: "CDB diário", category: "Renda fixa", description: "Uma reserva que pode render todos os dias e continuar acessível.", risk: "Conservador", minimumCents: 1000, accent: "#8bbd45", icon: "CDB" },
  { symbol: "TESOURO", name: "Tesouro Selic", shortName: "Tesouro Selic", category: "Renda fixa", description: "Para construir uma reserva com estabilidade e previsibilidade.", risk: "Conservador", minimumCents: 10000, accent: "#4a8b78", icon: "TS" },
  { symbol: "BOVA11", name: "ETF Brasil amplo", shortName: "Brasil amplo", category: "ETFs", description: "Uma cesta diversificada para acompanhar as maiores empresas brasileiras.", risk: "Moderado", minimumCents: 1000, accent: "#d79b42", icon: "BR" },
  { symbol: "IVVB11", name: "ETF mercado global", shortName: "Mundo", category: "ETFs", description: "Exposição a empresas globais em uma única escolha.", risk: "Moderado", minimumCents: 1000, accent: "#6e7fd5", icon: "GL" },
  { symbol: "PETR4", name: "Petrobras", shortName: "Petrobras", category: "Ações", description: "Participação em uma das empresas mais conhecidas do país.", risk: "Arrojado", minimumCents: 1000, accent: "#48a47d", icon: "P" },
  { symbol: "ITUB4", name: "Itaú Unibanco", shortName: "Itaú", category: "Ações", description: "Uma alternativa para quem quer acompanhar o setor financeiro.", risk: "Arrojado", minimumCents: 1000, accent: "#e47b5a", icon: "I" },
];

export const investmentCategories: InvestmentCategory[] = ["Todos", "Renda fixa", "ETFs", "Ações"];
