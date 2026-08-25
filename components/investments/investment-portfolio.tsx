"use client";

import { useMemo } from "react";
import { ArrowUpRight, BarChart3, CircleAlert, TrendingUp } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestmentPosition } from "@/server/investments";
import { formatBRL } from "@/lib/utils";

function projectedValue(initial: number, months: number, annualRate = 10) { return initial * Math.pow(1 + annualRate / 100 / 12, months); }

export function InvestmentPortfolio({ positions }: { positions: InvestmentPosition[] }) {
  return <section className="mt-7" aria-label="Investimentos já cadastrados"><div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sua carteira</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Investimentos já cadastrados</h2><p className="mt-1 text-sm text-muted-foreground">Veja o que cada aplicação representa hoje e uma projeção individual.</p></div><span className="text-xs text-muted-foreground">Hipótese: 10% ao ano · 5 anos</span></div>{positions.length ? <div className="grid gap-4 md:grid-cols-2">{positions.map((position) => <PortfolioCard key={position.id} position={position} />)}</div> : <Card><CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground"><CircleAlert className="size-5 text-status-warning" />Suas aplicações aparecerão aqui depois que você escolher uma opção no catálogo.</CardContent></Card>}</section>;
}

function PortfolioCard({ position }: { position: InvestmentPosition }) {
  const projection = useMemo(() => { const current = (position.currentCents ?? position.investedCents) / 100; const future = projectedValue(current, 60); return { current, future, gain: future - current }; }, [position.currentCents, position.investedCents]);
  const result = position.resultCents ?? 0;
  const positive = result >= 0;
  return <Card className="overflow-hidden"><div className="h-1 bg-primary" /><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{position.symbol}</CardTitle><CardDescription>{position.quantityMilli / 1000} unidades · aquisição em {position.acquiredAt}</CardDescription></div><span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary"><BarChart3 className="size-4" /></span></div></CardHeader><CardContent className="grid gap-4"><div className="flex items-end justify-between gap-3"><div><p className="text-xs text-muted-foreground">Valor acompanhado</p><p className="mt-1 text-2xl font-semibold">{formatBRL((position.currentCents ?? position.investedCents))}</p></div><div className={`flex items-center gap-1 text-sm font-semibold ${positive ? "text-status-success" : "text-status-danger"}`}><ArrowUpRight className={`size-4 ${positive ? "" : "rotate-90"}`} />{positive ? "+" : "−"}{formatBRL(Math.abs(result))}</div></div><div className="rounded-2xl border border-primary/15 bg-primary/5 p-4"><div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-semibold text-primary"><TrendingUp className="size-3.5" />Projeção em 5 anos</p><span className="text-xs text-muted-foreground">sem novos aportes</span></div><p className="mt-2 text-xl font-semibold">{formatBRL(projection.future * 100)}</p><p className="mt-1 text-xs text-muted-foreground">Possível crescimento de {formatBRL(projection.gain * 100)} sobre o valor acompanhado.</p></div><p className="text-[11px] leading-4 text-muted-foreground">Estimativa ilustrativa com taxa constante de 10% ao ano. O resultado real pode variar e não é garantia de rentabilidade.</p></CardContent></Card>;
}
