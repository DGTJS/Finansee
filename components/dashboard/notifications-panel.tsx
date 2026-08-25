"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, CircleAlert, Check, RefreshCw, X } from "@/components/icons";
import { Button } from "@/components/ui/button";

type AlertItem = { id: string; title: string; body: string; severity: string; readAt: string | null; createdAt: string };
type TransactionItem = { id: string; description: string; amountCents: number; kind: string; status: string; accountName: string; accountOwnerName: string | null; createdAt: string };
type ResponseData = { alerts: AlertItem[]; transactions: TransactionItem[]; unreadCount: number };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export function NotificationsPanel() {
  const searchParams = useSearchParams();
  const space = searchParams.get("space");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ResponseData>({ alerts: [], transactions: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true); else setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const query = space ? `?space=${encodeURIComponent(space)}` : "";
      const response = await fetch(`/api/notifications${query}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json().catch(() => null) as (ResponseData & { message?: string }) | null;
      if (!response.ok) throw new Error(payload?.message ?? "Não foi possível carregar as notificações.");
      setData({ alerts: payload?.alerts ?? [], transactions: payload?.transactions ?? [], unreadCount: payload?.unreadCount ?? 0 });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") setError("O carregamento demorou demais. Tente novamente.");
      else setError(cause instanceof Error ? cause.message : "Não foi possível carregar as notificações.");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  }, [space]);

  useEffect(() => { const timer = window.setTimeout(() => void loadNotifications(), 0); return () => window.clearTimeout(timer); }, [loadNotifications]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    const timer = window.setTimeout(() => void loadNotifications(true), 0);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", closeOnEscape); };
  }, [open, loadNotifications]);

  async function markRead() {
    setMarking(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ space }), cache: "no-store" });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Não foi possível marcar as notificações.");
      await loadNotifications(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível marcar as notificações.");
    } finally {
      setMarking(false);
    }
  }

  const hasContent = data.alerts.length > 0 || data.transactions.length > 0;
  return <>
    <Button type="button" variant="ghost" size="icon" className="relative size-10 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)} aria-label={data.unreadCount ? `Abrir notificações, ${data.unreadCount} não lidas` : "Abrir notificações"}>
      <Bell />
      {data.unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-status-danger ring-2 ring-background" aria-hidden="true" />}
    </Button>
    <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
        <motion.aside role="dialog" aria-modal="true" aria-labelledby="notifications-title" className="absolute right-0 top-0 flex h-full w-[min(100%,25rem)] flex-col border-l border-border bg-card text-card-foreground shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={(event) => event.stopPropagation()}>
          <header className="border-b border-border bg-card/95 px-5 pb-4 pt-6 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Central de atividade</p><h2 id="notifications-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">Notificações</h2><p className="mt-1 text-sm text-muted-foreground">Alertas importantes e movimentações recentes.</p></div>
              <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-2" aria-label="Fechar notificações" onClick={() => setOpen(false)}><X /></Button>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"><span className={`size-1.5 rounded-full ${data.unreadCount ? "bg-status-danger" : "bg-primary"}`} />{data.unreadCount ? `${data.unreadCount} não ${data.unreadCount === 1 ? "lida" : "lidas"}` : "Tudo em dia"}</span>
              <div className="flex items-center gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => void loadNotifications(true)} disabled={loading || refreshing} aria-label="Atualizar notificações"><RefreshCw className={refreshing ? "animate-spin" : ""} />Atualizar</Button>{data.unreadCount > 0 && <Button type="button" variant="outline" size="sm" onClick={() => void markRead()} disabled={marking || refreshing}>{marking ? "Salvando..." : "Marcar lidas"}</Button>}</div>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {error && <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-status-danger/30 bg-status-danger/10 p-3 text-sm"><CircleAlert className="mt-0.5 shrink-0 text-status-danger" /><div className="min-w-0 flex-1"><p className="font-medium">Não foi possível atualizar</p><p className="mt-1 text-xs text-muted-foreground">{error}</p><Button type="button" variant="ghost" size="sm" className="mt-2 px-0 text-foreground" onClick={() => void loadNotifications(true)}>Tentar novamente</Button></div></div>}
            {loading ? <div className="grid gap-3" aria-label="Carregando notificações"><div className="h-24 animate-pulse rounded-2xl bg-muted" /><div className="h-20 animate-pulse rounded-2xl bg-muted" /><div className="h-20 animate-pulse rounded-2xl bg-muted" /></div> : hasContent ? <div className="grid gap-5">
              {data.alerts.length > 0 && <section aria-labelledby="alerts-heading"><div className="mb-2 flex items-center gap-2 px-1"><CircleAlert className="size-4 text-primary" /><h3 id="alerts-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Alertas</h3></div><div className="grid gap-2">{data.alerts.map((item) => <article key={item.id} className={`rounded-2xl border p-4 transition-colors ${item.readAt ? "border-border bg-background/50" : "border-primary/30 bg-primary/5"}`}><div className="flex items-start gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.readAt ? "bg-muted-foreground/40" : item.severity === "danger" ? "bg-status-danger" : "bg-primary"}`} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{item.title}</p><time className="shrink-0 text-[10px] text-muted-foreground">{dateLabel(item.createdAt)}</time></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p></div></div></article>)}</div></section>}
              {data.transactions.length > 0 && <section aria-labelledby="activity-heading"><div className="mb-2 flex items-center gap-2 px-1"><Check className="size-4 text-muted-foreground" /><h3 id="activity-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Atividade recente</h3></div><div className="grid gap-2">{data.transactions.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-background/50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.description}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.accountName}{item.accountOwnerName ? ` · ${item.accountOwnerName}` : ""}</p></div><strong className={`shrink-0 text-sm ${item.amountCents >= 0 ? "text-status-success" : "text-foreground"}`}>{item.amountCents >= 0 ? "+" : "−"}{money.format(Math.abs(item.amountCents) / 100)}</strong></div><div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>{item.status === "paid" ? "Pago" : "Pendente"}</span><time>{dateLabel(item.createdAt)}</time></div></article>)}</div></section>}
            </div> : <div className="grid min-h-[22rem] place-items-center px-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Bell /></span><p className="mt-4 font-display text-lg font-semibold">Tudo tranquilo por aqui</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Quando houver um alerta financeiro, ele aparecerá nesta central.</p><Button type="button" variant="outline" size="sm" className="mt-5" onClick={() => void loadNotifications(true)}><RefreshCw />Verificar novamente</Button></div></div>}
          </div>
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
  </>;
}
