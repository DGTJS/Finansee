"use client";

import { useRef, useState, useTransition } from "react";
import { Banknote, Check, CircleAlert, Sparkles, Trash2 } from "@/components/icons";
import { analyzeStatement, confirmImportedTransactions, type ImportedStatementRow } from "@/server/actions/statement-import";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; kind: string };
type Account = { value: string; label: string };
type Props = { spaceId: string; accounts: Account[]; categories: Option[]; onImported: () => void };
type ReviewRow = ImportedStatementRow & { selected: boolean };

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatAmount(cents: number) { return money.format(Math.abs(cents) / 100); }
function parseAmount(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Math.round(Number(digits) * (digits.length > 2 ? 1 : 100)) : 0;
}
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR"); }

export function StatementImportDialog({ spaceId, accounts, categories, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const selectedCount = rows.filter((row) => row.selected).length;

  function chooseFile(file?: File) {
    if (!file) return;
    const form = new FormData(); form.set("spaceId", spaceId); form.set("file", file);
    startTransition(async () => {
      const result = await analyzeStatement(form);
      setMessage(result.message ?? "");
      if (result.success && result.data) { setRows(result.data.map((row) => ({ ...row, selected: !row.isDuplicate }))); setOpen(true); }
    });
  }
  function updateRow(id: string, patch: Partial<ImportedStatementRow>) { setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch, isDuplicate: false, selected: true } : row)); }
  function toggleRow(id: string) { setRows((current) => current.map((row) => row.id === id ? { ...row, selected: !row.selected } : row)); }
  function removeRow(id: string) { setRows((current) => current.filter((row) => row.id !== id)); }
  function confirm() {
    const selected = rows.filter((row) => row.selected);
    if (!selected.length) { setMessage("Selecione ao menos um lançamento novo para importar."); return; }
    startTransition(async () => {
      const result = await confirmImportedTransactions({ spaceId, rows: selected.map((row) => ({ date: row.date, description: row.description, amountCents: row.amountCents, kind: row.kind, accountId: row.accountId, categoryId: row.categoryId })) });
      setMessage(result.message ?? "");
      if (result.success) { setRows([]); setOpen(false); onImported(); }
    });
  }

  return <>
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" onClick={() => { setMessage(""); inputRef.current?.click(); }} disabled={pending || !accounts.length}>
        <Banknote data-icon="inline-start" />Importar extrato
      </Button>
      {message && !open && <p className="max-w-xs text-xs text-status-danger" role="status">{message}</p>}
    </div>
    <input ref={inputRef} type="file" accept=".csv,.pdf,text/csv,application/pdf" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
    <Dialog open={open} onOpenChange={(value) => !pending && setOpen(value)}>
      <DialogContent className="w-[min(calc(100vw-1rem),58rem)] max-w-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" />Revisar extrato</DialogTitle>
          <DialogDescription>Confira a análise antes de confirmar. Edite qualquer campo, remova itens e confirme somente o que deve entrar no Finansee.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Análise inteligente:</strong> identificamos entradas, gastos, assinaturas e categorias por descrição. O arquivo não é gravado até sua confirmação.</div>
        <div className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
          {rows.map((row) => <article key={row.id} className={cn("rounded-2xl border p-3", row.isDuplicate ? "border-status-warning/50 bg-status-warning/5" : "border-border bg-card")}>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={row.selected} aria-label={`Selecionar ${row.description}`} onChange={() => toggleRow(row.id)} className="mt-1 size-4 accent-primary" />
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase", row.kind === "income" ? "bg-status-success/15 text-status-success" : "bg-muted text-muted-foreground")}>{row.kind === "income" ? "Ganho" : "Gasto"}</span>{row.isDuplicate && <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/15 px-2 py-1 text-[10px] font-bold text-status-warning"><CircleAlert className="size-3" />Possível duplicidade</span>}</div><p className="mt-2 text-xs text-muted-foreground">{formatDate(row.date)} · {formatAmount(row.amountCents)}</p></div>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 text-status-danger" aria-label={`Excluir ${row.description}`} onClick={() => removeRow(row.id)}><Trash2 /></Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Input className="lg:col-span-2" value={row.description} aria-label="Descrição" onChange={(event) => updateRow(row.id, { description: event.target.value })} />
              <Input type="date" value={row.date} aria-label="Data" onChange={(event) => updateRow(row.id, { date: event.target.value })} />
              <Input inputMode="decimal" value={formatAmount(row.amountCents)} aria-label="Valor" onChange={(event) => updateRow(row.id, { amountCents: (row.kind === "expense" ? -1 : 1) * Math.abs(parseAmount(event.target.value)) })} />
              <select value={row.kind} aria-label="Tipo" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" onChange={(event) => updateRow(row.id, { kind: event.target.value as "income" | "expense", categoryId: categories.find((category) => category.kind === event.target.value)?.value ?? row.categoryId })}><option value="expense">Gasto</option><option value="income">Ganho</option></select>
              <select value={row.accountId} aria-label="Conta" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" onChange={(event) => updateRow(row.id, { accountId: event.target.value })}>{accounts.map((account) => <option key={account.value} value={account.value}>{account.label}</option>)}</select>
              <select value={row.categoryId} aria-label="Categoria" className="h-10 rounded-xl border border-border bg-background px-3 text-sm sm:col-span-2 lg:col-span-2" onChange={(event) => updateRow(row.id, { categoryId: event.target.value })}>{categories.filter((category) => category.kind === row.kind).map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select>
            </div>
          </article>)}
          {!rows.length && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum lançamento pendente de revisão.</p>}
        </div>
        {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
        <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
          <Button type="button" onClick={confirm} disabled={pending || selectedCount === 0}><Check data-icon="inline-start" />{pending ? "Processando..." : `Confirmar ${selectedCount} novos`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
