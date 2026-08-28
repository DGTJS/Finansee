"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Check, CircleCheck, Sparkles, TrendingUp } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvestmentPosition } from "@/server/actions/investments";
import type { MarketQuote } from "@/server/investments";
import { formatBRL } from "@/lib/utils";
import { investmentCategories, investmentProducts, type InvestmentCategory } from "@/components/investments/investment-catalog";

const moneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function InvestmentMarketplace({ spaceId, quotes }: { spaceId: string; quotes: MarketQuote[] }) {
  const [category, setCategory] = useState<InvestmentCategory>("Todos");
  const [selectedSymbol, setSelectedSymbol] = useState(investmentProducts[0].symbol);
  const [amount, setAmount] = useState("100,00");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const products = useMemo(() => investmentProducts.filter((product) => category === "Todos" || product.category === category), [category]);
  const selected = investmentProducts.find((product) => product.symbol === selectedSymbol) ?? investmentProducts[0];
  const quote = quotes.find((item) => item.symbol === selected.symbol);
  const unitPrice = quote?.price ?? (selected.category === "Renda fixa" ? 1 : selected.symbol === "BOVA11" ? 122.4 : selected.symbol === "IVVB11" ? 314.8 : 38.5);
  const amountCents = Math.round(Math.max(Number(amount.replace(",", ".")) || 0, 0) * 100);
  const estimatedQuantity = unitPrice > 0 ? amountCents / 100 / unitPrice : 0;

  function chooseCategory(nextCategory: InvestmentCategory) {
    setCategory(nextCategory);
    const first = investmentProducts.find((product) => nextCategory === "Todos" || product.category === nextCategory);
    if (first) setSelectedSymbol(first.symbol);
  }

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData();
    form.set("spaceId", spaceId);
    form.set("symbol", selected.symbol);
    form.set("quantity", String(Math.max(estimatedQuantity, 0.001)));
    form.set("averagePrice", String(unitPrice));
    form.set("acquiredAt", new Date().toISOString().slice(0, 10));
    startTransition(async () => { const result = await createInvestmentPosition(form); setMessage(result.message ?? ""); });
  }

  return <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
    <Card className="overflow-hidden border-primary/20 shadow-[0_18px_50px_color-mix(in_srgb,var(--primary)_8%,transparent)]"><CardHeader className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card pb-5"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />Escolha guiada</div><CardTitle className="text-xl sm:text-2xl">Onde você quer colocar seu dinheiro?</CardTitle><CardDescription className="mt-2 max-w-lg">Selecione uma opção pronta e veja como começar. Sem códigos, sem telas de corretora.</CardDescription></div><span className="hidden size-12 place-items-center rounded-2xl bg-primary/15 text-primary sm:grid"><TrendingUp /></span></div></CardHeader><CardContent className="p-4 sm:p-6"><div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categorias de investimento">{investmentCategories.map((item) => <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => chooseCategory(item)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${category === item ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>{item}</button>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{products.map((product) => { const active = product.symbol === selected.symbol; return <button key={product.symbol} type="button" aria-pressed={active} onClick={() => setSelectedSymbol(product.symbol)} className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${active ? "border-primary bg-primary/8 shadow-[0_0_0_1px_var(--primary)]" : "border-border bg-card hover:border-primary/40"}`}><span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: product.accent }} /><span className="flex items-start justify-between gap-3 pl-2"><span className="grid size-10 shrink-0 place-items-center rounded-xl text-xs font-black text-white" style={{ backgroundColor: product.accent }}>{product.icon}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${product.risk === "Conservador" ? "bg-status-success/15 text-status-success" : product.risk === "Moderado" ? "bg-status-warning/15 text-status-warning" : "bg-status-danger/15 text-status-danger"}`}>{product.risk}</span></span><span className="mt-4 block pl-2 text-sm font-semibold">{product.name}</span><span className="mt-1 block pl-2 text-xs leading-5 text-muted-foreground">{product.description}</span>{active && <Check className="absolute bottom-4 right-4 size-4 text-primary" />}</button>; })}</div></CardContent></Card>
    <Card className="h-fit border-border bg-sidebar text-sidebar-foreground"><CardHeader><CardDescription className="text-sidebar-foreground/65">Sua próxima aplicação</CardDescription><CardTitle className="text-xl text-sidebar-foreground">{selected.name}</CardTitle><p className="text-sm text-sidebar-foreground/65">{selected.category} · mínimo de {formatBRL(selected.minimumCents)}</p></CardHeader><CardContent><form className="grid gap-4" onSubmit={apply}><div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4"><Label htmlFor="investment-amount" className="text-sidebar-foreground/75">Quanto investir?</Label><div className="mt-2 flex items-center gap-2"><span className="text-lg text-sidebar-foreground/60">R$</span><Input id="investment-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" type="number" min={selected.minimumCents / 100} step="0.01" className="h-12 border-0 bg-transparent px-0 text-2xl font-semibold text-sidebar-foreground shadow-none focus-visible:ring-0" required /></div><p className="mt-2 text-xs text-sidebar-foreground/55">Você pode começar a partir de {formatBRL(selected.minimumCents)}.</p></div><div className="grid gap-2 rounded-2xl border border-sidebar-border p-4 text-sm"><div className="flex items-center justify-between gap-3"><span className="text-sidebar-foreground/65">Estimativa de unidades</span><strong>{estimatedQuantity.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</strong></div><div className="flex items-center justify-between gap-3"><span className="text-sidebar-foreground/65">Valor de referência</span><strong>{moneyFormat.format(unitPrice)}</strong></div></div><div className="flex items-start gap-2 text-xs leading-5 text-sidebar-foreground/60"><CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />O Finansee registra sua aplicação para acompanhar a evolução. Confirme sempre as condições antes de investir.</div><Button type="submit" loading={pending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">{pending ? "Registrando..." : "Aplicar neste objetivo"}<ArrowRight data-icon /></Button>{message && <p className="text-sm text-sidebar-foreground/75" role="status">{message}</p>}</form></CardContent></Card>
  </section>;
}
