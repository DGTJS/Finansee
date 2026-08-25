"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart3, Check, Target, TrendingUp } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/utils";

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyInput(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".")) || 0;
}

function futureValue(initial: number, monthly: number, months: number, annualRate: number) {
  const rate = annualRate / 100 / 12;
  const growth = Math.pow(1 + rate, months);
  return initial * growth + (rate === 0 ? monthly * months : monthly * ((growth - 1) / rate));
}

function formatChartAxisBRL(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1_000) {
    return formatBRL(value * 100);
  }

  const unit = absoluteValue >= 1_000_000_000 ? "bi" : absoluteValue >= 1_000_000 ? "mi" : "mil";
  const divisor = unit === "bi" ? 1_000_000_000 : unit === "mi" ? 1_000_000 : 1_000;
  const formattedValue = (value / divisor).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });

  return `R$ ${formattedValue} ${unit}`;
}

export function InvestmentProjection({ initialCents = 0 }: { initialCents?: number }) {
  const [initial, setInitial] = useState(formatCurrencyInput(String(Math.max(initialCents, 10000))));
  const [monthly, setMonthly] = useState(formatCurrencyInput("30000"));
  const [period, setPeriod] = useState("5");
  const [unit, setUnit] = useState<"years" | "months">("years");
  const [annualRate, setAnnualRate] = useState("10");
  const [target, setTarget] = useState(formatCurrencyInput("10000000"));

  const values = useMemo(() => {
    const initialValue = Math.max(parseCurrencyInput(initial), 0);
    const monthlyValue = Math.max(parseCurrencyInput(monthly), 0);
    const months = Math.max(Math.round(Number(period) || 1) * (unit === "years" ? 12 : 1), 1);
    const rate = Math.max(Number(annualRate.replace(",", ".")) || 0, 0);
    const targetValue = Math.max(parseCurrencyInput(target), 0);
    const withoutMonthly = futureValue(initialValue, 0, months, rate);
    const withMonthly = futureValue(initialValue, monthlyValue, months, rate);
    const monthlyRate = rate / 100 / 12;
    const growth = Math.pow(1 + monthlyRate, months);
    const factor = monthlyRate === 0 ? months : (growth - 1) / monthlyRate;
    const pointCount = unit === "years" ? Math.min(Number(period) || 1, 12) + 1 : 13;
    const points = Array.from({ length: pointCount }, (_, index) => { const pointMonths = unit === "years" ? Math.min(months, index * 12) : Math.min(months, Math.round((months * index) / 12)); const label = index === 0 ? "Hoje" : unit === "years" ? `${index}a` : `${Math.max(pointMonths, 1)}m`; return { label, without: futureValue(initialValue, 0, pointMonths, rate), with: futureValue(initialValue, monthlyValue, pointMonths, rate) }; });
    return { initialValue, monthlyValue, months, rate, withoutMonthly, withMonthly, targetValue, points, requiredMonthly: Math.max((targetValue - initialValue * growth) / factor, 0), investedWithMonthly: initialValue + monthlyValue * months };
  }, [annualRate, initial, monthly, period, target, unit]);

  const periodLabel = unit === "years" ? `${period} ${Number(period) === 1 ? "ano" : "anos"}` : `${period} ${Number(period) === 1 ? "mês" : "meses"}`;
  const chartConfig = { without: { label: "Sem aporte", color: "var(--muted-foreground)" }, with: { label: "Com aporte mensal", color: "var(--primary)" } };
  const chartFormatter = (value: number | string) => formatBRL(Number(value) * 100);
  const chartAxisFormatter = formatChartAxisBRL;

  return <section className="mt-6 grid gap-5" aria-label="Simulador de investimentos">
    <Card className="overflow-hidden border-primary/20">
    <CardHeader className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <TrendingUp className="size-3.5" />Simulador de crescimento
        </div>
        <CardTitle className="text-xl sm:text-2xl">Veja o futuro do seu dinheiro
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl">Compare deixar um valor parado com investir e fazer aportes todos os meses.</CardDescription></div>
          <span className="hidden size-12 place-items-center rounded-2xl bg-primary/15 text-primary sm:grid"><BarChart3 /></span></div></CardHeader><CardContent className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-semibold">Projeção para {periodLabel}</p><p className="mt-1 text-xs text-muted-foreground">Estimativa com {annualRate}% ao ano</p></div><div className="flex flex-wrap gap-3 text-xs"><span className="inline-flex items-center gap-2"><i className="size-2.5 rounded-full bg-muted-foreground" />Sem aporte</span><span className="inline-flex items-center gap-2"><i className="size-2.5 rounded-full bg-primary" />Com aporte mensal</span></div></div><ChartContainer config={chartConfig} className="mt-6 h-64 w-full sm:h-80"><AreaChart data={values.points} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}><defs><linearGradient id="investment-with" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} /><YAxis axisLine={false} tickLine={false} tickMargin={8} width={88} tickFormatter={chartAxisFormatter} /><ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent formatter={chartFormatter} />} /><Area type="monotone" dataKey="without" name="Sem aporte" stroke="var(--muted-foreground)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" /><Area type="monotone" dataKey="with" name="Com aporte mensal" stroke="var(--primary)" fill="url(#investment-with)" strokeWidth={2.5} /></AreaChart></ChartContainer><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border p-4"><p className="text-xs text-muted-foreground">Sem aporte mensal</p><p className="mt-1 text-xl font-semibold">{formatBRL(values.withoutMonthly * 100)}</p><p className="mt-1 text-xs text-muted-foreground">Rendimento estimado: {formatBRL(Math.max(values.withoutMonthly - values.initialValue, 0) * 100)}</p></div><div className="rounded-2xl border border-primary/25 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">Com aporte mensal</p><p className="mt-1 text-xl font-semibold text-primary">{formatBRL(values.withMonthly * 100)}</p><p className="mt-1 text-xs text-muted-foreground">Total colocado: {formatBRL(values.investedWithMonthly * 100)}</p></div></div></div><div className="grid content-start gap-4"><div className="grid gap-2"><Label htmlFor="projection-initial">Valor inicial</Label><Input id="projection-initial" type="text" inputMode="decimal" value={initial} onChange={(event) => setInitial(formatCurrencyInput(event.target.value))} className="h-11 rounded-xl" /></div><div className="grid gap-2"><Label htmlFor="projection-monthly">Aporte mensal</Label><Input id="projection-monthly" type="text" inputMode="decimal" value={monthly} onChange={(event) => setMonthly(formatCurrencyInput(event.target.value))} className="h-11 rounded-xl" /></div><div className="grid grid-cols-[1fr_auto] gap-2"><div className="grid gap-2"><Label htmlFor="projection-period">Período</Label><Input id="projection-period" type="number" min="1" max={unit === "years" ? "50" : "600"} value={period} onChange={(event) => setPeriod(event.target.value)} className="h-11 rounded-xl" /></div><div className="grid gap-2"><Label htmlFor="projection-unit">Unidade</Label><Select value={unit} onValueChange={(value) => setUnit(value as "years" | "months")}><SelectTrigger id="projection-unit" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="years">Anos</SelectItem><SelectItem value="months">Meses</SelectItem></SelectGroup></SelectContent></Select></div></div><div className="grid gap-2"><Label htmlFor="projection-rate">Taxa anual estimada (%)</Label><Input id="projection-rate" type="number" min="0" step="0.1" value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} className="h-11 rounded-xl" /></div><p className="text-xs leading-5 text-muted-foreground">A taxa é uma hipótese para simulação, não uma promessa de rentabilidade.</p></div></CardContent></Card><Card className="border-primary/20 bg-sidebar text-sidebar-foreground"><CardHeader><div className="flex items-center gap-2 text-primary"><Target className="size-4" /><CardTitle className="text-lg text-sidebar-foreground">Quanto preciso investir?</CardTitle></div><CardDescription className="text-sidebar-foreground/65">Descubra o aporte mensal necessário para alcançar sua meta em {periodLabel}.</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="grid gap-2"><Label htmlFor="projection-target" className="text-sidebar-foreground/75">Minha meta</Label><Input id="projection-target" type="text" inputMode="decimal" value={target} onChange={(event) => setTarget(formatCurrencyInput(event.target.value))} className="h-12 border-sidebar-border bg-sidebar-accent text-xl font-semibold text-sidebar-foreground" /></div><div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <p className="text-xs text-sidebar-foreground">Aporte mensal estimado</p><p className="mt-1 text-3xl font-semibold text-sidebar-foreground/60">{formatBRL(values.requiredMonthly * 100)}</p><p className="mt-2 text-xs leading-5 ">Começando com {formatBRL(values.initialValue * 100)} e mantendo a hipótese de {values.rate}% ao ano.</p></div><div className="flex items-start gap-2 text-xs leading-5 text-sidebar-foreground/60"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Se a meta já estiver abaixo do valor projetado sem aportes, o aporte necessário aparece como zero.</div></CardContent></Card></section>;
}
