"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDownRight, BarChart3, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Search, WalletCards } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cancelTransaction, deleteTransactions } from "@/server/actions/transactions";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";
import { StatementImportDialog } from "@/components/transactions/statement-import-dialog";
import { TransactionList, type TransactionListItem } from "@/components/ui/transaction-list";

type Item = { id: string; description: string; source: string | null; amountCents: number; kind: string; status: string; competenceDate: string; dueDate: string | null; accountId: string; categoryId: string | null; accountName: string | null; accountType: string | null; accountOwnerImage: string | null; categoryName: string | null };
type View = "all" | "debit" | "credit" | "investment";

const statusLabels: Record<string, string> = { all: "Todos os status", paid: "Pagas", pending: "Pendentes", overdue: "Atrasadas", cancelled: "Canceladas" };

type TransactionOptions = { accounts: { value: string; label: string; type: string }[]; categories: { value: string; label: string; kind: string }[] };

export function TransactionsPage({ initialItems, options, spaceId = "personal-space" }: { initialItems: Item[]; options: TransactionOptions; spaceId?: string }) {
  const [items, setItems] = useState(initialItems); const [editingItem, setEditingItem] = useState<Item | null>(null); const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [view, setView] = useState<View>("all"); const [page, setPage] = useState(1); const [pending, startTransition] = useTransition();
  const groups = useMemo(() => ({ all: items, debit: items.filter((item) => getGroup(item) === "debit"), credit: items.filter((item) => getGroup(item) === "credit"), investment: items.filter((item) => getGroup(item) === "investment") }), [items]);
  const filtered = useMemo(() => groups[view].filter((item) => (!search || item.description.toLowerCase().includes(search.toLowerCase()) || item.categoryName?.toLowerCase().includes(search.toLowerCase())) && (status === "all" || item.status === status)), [groups, search, status, view]);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function cancel(id: string) { startTransition(async () => { const result = await cancelTransaction(id, spaceId); if (result.success) setItems((current) => current.filter((item) => item.id !== id)); }); }
  async function deleteMany(ids: string[]) { const result = await deleteTransactions(ids, spaceId); if (result.success) setItems((current) => current.filter((item) => !ids.includes(item.id))); return result; }

  const filters = <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(0,1fr)_auto_auto]"><div className="relative min-w-0"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Buscar transação" className="h-11 rounded-xl pl-10" aria-label="Buscar transação" /></div><Select value={status} onValueChange={(value) => { if (value) { setPage(1); setStatus(value); } }}><SelectTrigger className="h-11 min-w-32 rounded-xl"><SelectValue>{statusLabels[status]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="paid">Pagas</SelectItem><SelectItem value="pending">Pendentes</SelectItem><SelectItem value="overdue">Atrasadas</SelectItem><SelectItem value="cancelled">Canceladas</SelectItem></SelectContent></Select><Button type="button" variant="outline" className="h-11" onClick={() => { setPage(1); setSearch(""); setStatus("all"); }}>Limpar filtros</Button></div>;

  return <main className="min-h-screen bg-background lg:pl-64"><div className="mx-auto max-w-[1280px] px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-24"><header className="flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm text-muted-foreground">Movimentações financeiras</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Transações</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Separe seus lançamentos por origem e acompanhe cada movimento com clareza.</p></div><div className="flex flex-wrap gap-2"><StatementImportDialog spaceId={spaceId} accounts={options.accounts} categories={options.categories} onImported={() => window.location.reload()} /><NewTransactionDialog spaceId={spaceId} accounts={options.accounts} categories={options.categories} onCreated={() => window.location.reload()} /></div></header>
    <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3"><ViewButton active={view === "all"} label="Todos" count={groups.all.length} icon={<WalletCards className="size-4" />} onClick={() => { setPage(1); setView("all"); }} /><ViewButton active={view === "debit"} label="Débito" count={groups.debit.length} icon={<ArrowDownRight className="size-4" />} onClick={() => { setPage(1); setView("debit"); }} tone="blue" /><ViewButton active={view === "credit"} label="Crédito" count={groups.credit.length} icon={<CreditCard className="size-4" />} onClick={() => { setPage(1); setView("credit"); }} tone="purple" /><ViewButton active={view === "investment"} label="Investimentos" count={groups.investment.length} icon={<BarChart3 className="size-4" />} onClick={() => { setPage(1); setView("investment"); }} tone="lime" /></div>
    <TransactionList className="mt-6" wide fixedHeight transactions={visibleItems.map(toTransactionListItem)} title={viewLabels[view]} description={`${filtered.length} movimentações encontradas nesta visão · Valores em BRL`} toolbar={filters} footer={<div className="mx-auto mb-4 mt-2 flex w-11/12 items-center justify-between gap-3 rounded-xl bg-accent px-3 py-2"><Button type="button" variant="ghost" size="icon" aria-label="Página anterior" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft /></Button><span className="text-xs font-medium text-muted-foreground">Página {safePage} de {totalPages}</span><Button type="button" variant="ghost" size="icon" aria-label="Próxima página" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight /></Button></div>} onCancel={cancel} onBulkDelete={deleteMany} onEdit={(item) => setEditingItem(items.find((entry) => entry.id === item.id) ?? null)} cancelling={pending} /><NewTransactionDialog key={editingItem?.id ?? "new-edit"} className="hidden" open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)} initialTransaction={editingItem ? { id: editingItem.id, date: editingItem.competenceDate, description: editingItem.description, kind: editingItem.kind, source: editingItem.source, amountCents: editingItem.amountCents, accountId: editingItem.accountId, categoryId: editingItem.categoryId ?? "" } : null} onUpdated={() => window.location.reload()} spaceId={spaceId} accounts={options.accounts} categories={options.categories} /><p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><CalendarDays className="size-4" />Datas no fuso de negócio do Finansee.</p></div></main>;
}

const viewLabels: Record<View, string> = { all: "Todos os lançamentos", debit: "Lançamentos em débito", credit: "Lançamentos no crédito", investment: "Investimentos" };

function getGroup(item: Item): Exclude<View, "all"> {
  if (item.accountType === "investment" || item.categoryName?.toLowerCase().includes("invest")) return "investment";
  if (item.accountType === "credit_card") return "credit";
  return "debit";
}

function ViewButton({ active, label, count, icon, onClick, tone = "default" }: { active: boolean; label: string; count: number; icon: React.ReactNode; onClick: () => void; tone?: "default" | "blue" | "purple" | "lime" }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-20 min-w-0 w-full flex-col items-start gap-2 overflow-hidden rounded-2xl border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-16 sm:flex-row sm:items-center sm:gap-3 sm:p-4 ${active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-xl sm:size-9 ${active ? "bg-primary text-primary-foreground" : tone === "purple" ? "bg-[var(--account-purple)]/15 text-[var(--account-purple)]" : tone === "blue" ? "bg-status-info/15 text-status-info" : tone === "lime" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{icon}</span><span className="min-w-0 max-w-full"><span className="block truncate text-[11px] font-semibold sm:text-sm">{label}</span><span className={`mt-0.5 block truncate text-[9px] sm:text-xs ${active ? "text-background/70" : "text-muted-foreground"}`}>{count} lançamentos</span></span></button>;
}

function toTransactionListItem(item: Item): TransactionListItem {
  const group = getGroup(item);
  const status = item.status === "paid" ? "Pago" : item.status === "pending" ? "Pendente" : item.status === "overdue" ? "Atrasado" : "Cancelado";
  return { id: item.id, name: item.description, type: `${item.kind === "income" ? "Receita" : "Despesa"} · ${item.categoryName ?? "Sem categoria"}${item.source ? ` · Origem: ${item.source}` : ""}`, amount: item.kind === "income" ? Math.abs(item.amountCents) / 100 : -Math.abs(item.amountCents) / 100, date: item.competenceDate, dueDate: item.dueDate, time: item.status === "pending" ? "Aguardando pagamento" : "Pagamento registrado", icon: group === "credit" ? <CreditCard className="size-4" /> : group === "investment" ? <BarChart3 className="size-4" /> : <WalletCards className="size-4" />, accountName: item.accountName ?? "Sem conta", accountType: item.accountType, accountImage: item.accountOwnerImage, status, paymentMethod: item.accountName ?? "Sem conta", source: item.source ?? undefined };
}
