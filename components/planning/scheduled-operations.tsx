"use client";

import { useState, useTransition } from "react";
import { Repeat, Split } from "@/components/icons";
import { createInstallmentPlan, createRecurrence, generateRecurringOccurrences, setRecurrenceActive } from "@/server/actions/scheduled";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: string; name: string };
type Category = { id: string; name: string };
type Recurrence = { id: string; description: string; kind: string; frequency: string; nextDate: string; endDate: string | null; active: boolean };

export function ScheduledOperations({ accounts, categories, recurrences, spaceId }: { accounts: Account[]; categories: Category[]; recurrences: Recurrence[]; spaceId: string }) {
  const [mode, setMode] = useState<"installment" | "recurrence">("installment");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [kind, setKind] = useState("expense");
  const [source, setSource] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("spaceId", spaceId);
    form.set("accountId", accountId);
    form.set("categoryId", categoryId);
    form.set("kind", kind);
    form.set("source", source);
    startTransition(async () => {
      const result = mode === "installment" ? await createInstallmentPlan(form) : await createRecurrence(form);
      setMessage(result.message ?? "");
      if (result.success) event.currentTarget.reset();
    });
  }

  function generate(item: Recurrence) {
    startTransition(async () => setMessage((await generateRecurringOccurrences(item.id, item.endDate ?? undefined)).message ?? ""));
  }

  return <Card className="mt-5">
    <CardHeader><CardTitle className="flex items-center gap-2"><Repeat />Operações programadas</CardTitle><CardDescription>Configure lançamentos parcelados ou receitas e despesas recorrentes.</CardDescription></CardHeader>
    <CardContent>
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1"><Button type="button" variant={mode === "installment" ? "default" : "ghost"} onClick={() => setMode("installment")}><Split data-icon />Parcelamento</Button><Button type="button" variant={mode === "recurrence" ? "default" : "ghost"} onClick={() => setMode("recurrence")}><Repeat data-icon />Recorrência</Button></div>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
        <label className="grid gap-2 sm:col-span-2"><Label htmlFor="scheduled-description">Descrição</Label><Input id="scheduled-description" name="description" required minLength={2} placeholder="Ex.: Aluguel ou compra parcelada" className="h-11 rounded-xl" /></label>
        <label className="grid gap-2"><Label htmlFor="scheduled-amount">Valor total (R$)</Label><CurrencyInput id="scheduled-amount" name="amount" required className="h-11 rounded-xl" /></label>
        <label className="grid gap-2"><Label>Tipo</Label><Select value={kind} onValueChange={(value) => value && setKind(value)}><SelectTrigger className="h-11 rounded-xl"><SelectValue>{kind === "income" ? "Receita" : "Despesa"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="expense">Despesa</SelectItem><SelectItem value="income">Receita</SelectItem></SelectContent></Select></label>
        {kind === "income" && <label className="grid gap-2 sm:col-span-2"><Label htmlFor="scheduled-source">Origem da receita</Label><Input id="scheduled-source" name="source" value={source} onChange={(event) => setSource(event.target.value)} required placeholder="Ex.: Salário, VA ou VR" className="h-11 rounded-xl" /></label>}
        <label className="grid gap-2"><Label>Conta</Label><Select value={accountId} onValueChange={(value) => value && setAccountId(value)}><SelectTrigger className="h-11 rounded-xl"><SelectValue>{accounts.find((item) => item.id === accountId)?.name ?? "Selecione"}</SelectValue></SelectTrigger><SelectContent>{accounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></label>
        <label className="grid gap-2"><Label>Categoria</Label><Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}><SelectTrigger className="h-11 rounded-xl"><SelectValue>{categories.find((item) => item.id === categoryId)?.name ?? "Selecione"}</SelectValue></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></label>
        <label className="grid gap-2"><Label htmlFor="scheduled-start">Data inicial</Label><Input id="scheduled-start" name="competenceDate" type="date" required className="h-11 rounded-xl" /></label>
        {mode === "installment" ? <label className="grid gap-2"><Label htmlFor="scheduled-installments">Parcelas</Label><Input id="scheduled-installments" name="installments" type="number" min="2" max="60" defaultValue="2" required className="h-11 rounded-xl" /></label> : <><label className="grid gap-2"><Label>Frequência</Label><Select value={frequency} onValueChange={(value) => value && setFrequency(value)}><SelectTrigger className="h-11 rounded-xl"><SelectValue>{frequency === "weekly" ? "Semanal" : "Mensal"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="weekly">Semanal</SelectItem></SelectContent></Select></label><input type="hidden" name="frequency" value={frequency} /></>}
        <label className="grid gap-2"><Label htmlFor="scheduled-due">Vencimento inicial</Label><Input id="scheduled-due" name="dueDate" type="date" className="h-11 rounded-xl" /></label>
        {mode === "recurrence" && <label className="grid gap-2"><Label htmlFor="scheduled-end">Data final</Label><Input id="scheduled-end" name="endDate" type="date" className="h-11 rounded-xl" /></label>}
        <div className="flex items-end sm:col-span-2 lg:col-span-4"><Button type="submit" disabled={pending || !accounts.length || !categories.length}>{pending ? "Salvando..." : mode === "installment" ? "Criar parcelamento" : "Criar recorrência"}</Button></div>
      </form>
      {message && <p className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm">{message}</p>}
      {recurrences.length > 0 && <div className="mt-6 grid gap-2 border-t border-border pt-5"><p className="text-sm font-semibold">Recorrências</p>{recurrences.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium">{item.description}</p><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{item.active ? "Ativa" : "Pausada"}</span></div><p className="text-xs text-muted-foreground">{item.kind === "income" ? "Receita" : "Despesa"} · {item.frequency === "weekly" ? "Semanal" : "Mensal"} · próxima em {item.nextDate}</p></div><div className="flex flex-wrap gap-2">{item.active && <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => generate(item)}>Gerar próximas</Button>}<Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(async () => setMessage((await setRecurrenceActive(item.id, !item.active)).message ?? ""))}>{item.active ? "Pausar" : "Reativar"}</Button></div></div>)}</div>}
    </CardContent>
  </Card>;
}
