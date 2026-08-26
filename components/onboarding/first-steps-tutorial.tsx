"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ArrowRight, BarChart3, Check, CreditCard, LayoutDashboard, Settings, Target, TrendingUp, Wallet, X } from "@/components/icons";
import { Button } from "@/components/ui/button";

type TutorialStatus = "active" | "completed" | "skipped";
type TutorialState = { status: TutorialStatus; step: number };

const steps = [
  { title: "Seu panorama financeiro", eyebrow: "Dashboard", description: "Comece pela visão geral: saldo, fluxo de caixa, contas a pagar e a saúde financeira do seu espaço.", href: "/", icon: LayoutDashboard, color: "from-lime-300/30 to-emerald-400/10" },
  { title: "Contas e cartões", eyebrow: "Contas", description: "Cadastre contas, cartões e saldos iniciais. É aqui que cada movimentação ganha um lugar certo.", href: "/accounts", icon: CreditCard, color: "from-sky-300/30 to-blue-500/10" },
  { title: "Movimente seu dinheiro", eyebrow: "Transações", description: "Registre receitas, despesas e transferências para manter o saldo e o mês sempre atualizados.", href: "/transactions", icon: Wallet, color: "from-amber-300/30 to-orange-400/10" },
  { title: "Planeje os próximos passos", eyebrow: "Planejamento", description: "Use orçamentos e metas para transformar seus planos em decisões acompanháveis.", href: "/planning", icon: Target, color: "from-violet-300/30 to-fuchsia-400/10" },
  { title: "Acompanhe investimentos", eyebrow: "Investimentos", description: "Visualize suas posições e acompanhe o patrimônio investido em um só lugar.", href: "/investments", icon: TrendingUp, color: "from-cyan-300/30 to-teal-400/10" },
  { title: "Leia o seu histórico", eyebrow: "Relatórios", description: "Compare períodos e encontre padrões para tomar decisões com mais clareza.", href: "/reports", icon: BarChart3, color: "from-rose-300/30 to-red-400/10" },
  { title: "Deixe tudo do seu jeito", eyebrow: "Configurações", description: "Gerencie seu perfil, membros, rendas e permissões do espaço financeiro.", href: "/settings", icon: Settings, color: "from-slate-300/30 to-slate-500/10" },
] as const;

const defaultState: TutorialState = { status: "active", step: 0 };

const storageListeners = new Set<() => void>();

function readState(raw: string): TutorialState {
  try {
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<TutorialState>;
    return { status: parsed.status === "completed" || parsed.status === "skipped" ? parsed.status : "active", step: Math.min(Math.max(Number(parsed.step) || 0, 0), steps.length - 1) };
  } catch {
    return defaultState;
  }
}

function subscribeToStorage(listener: () => void) {
  storageListeners.add(listener);
  return () => storageListeners.delete(listener);
}

export function FirstStepsTutorial({ userId }: { userId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const storageKey = `finansee:onboarding:${userId}`;
  const storedState = useSyncExternalStore(subscribeToStorage, () => typeof window === "undefined" ? "" : window.localStorage.getItem(storageKey) ?? "", () => "");
  const state = readState(storedState);
  const open = state.status === "active";

  const current = steps[state.step];
  const CurrentIcon = current.icon;

  function save(nextState: TutorialState) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
    storageListeners.forEach((listener) => listener());
  }

  function finish(status: "completed" | "skipped") {
    save({ status, step: steps.length - 1 });
  }

  function moveTo(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), steps.length - 1);
    save({ status: "active", step: nextIndex });
    if (steps[nextIndex].href !== pathname) router.push(steps[nextIndex].href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside key="first-steps" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.2 }} role="region" aria-label="Primeiros passos do Finansee" className="pointer-events-none fixed inset-x-4 bottom-4 z-40 sm:left-auto sm:right-6 sm:w-[min(27rem,calc(100vw-3rem))]">
          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-2xl shadow-foreground/15 backdrop-blur-xl">
            <div className={`relative overflow-hidden bg-gradient-to-br ${current.color} px-4 pb-4 pt-4 sm:px-5`}>
              <button type="button" onClick={() => finish("skipped")} className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Fechar tutorial"><X className="size-4" /></button>
              <div className="flex items-center gap-3 pr-8"><motion.span key={current.href} initial={{ scale: 0.8, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} className="grid size-10 shrink-0 place-items-center rounded-xl border border-foreground/10 bg-background/60 shadow-sm"><CurrentIcon className="size-4" /></motion.span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Finansee · primeiros passos</p><p className="mt-1 truncate text-xs font-semibold text-foreground">{current.eyebrow}</p></div></div>
              <AnimatePresence mode="wait" initial={false}><motion.div key={current.href} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}><h2 className="mt-4 max-w-sm text-lg font-semibold leading-tight">{current.title}</h2><p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground">{current.description}</p></motion.div></AnimatePresence>
            </div>
            <div className="grid gap-3 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-1.5" aria-label={`Passo ${state.step + 1} de ${steps.length}`}>{steps.map((item, index) => <button key={item.href} type="button" aria-label={`Ir para ${item.eyebrow}`} onClick={() => moveTo(index)} className="group flex flex-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className={`h-1.5 w-full rounded-full transition-colors ${index <= state.step ? "bg-primary" : "bg-muted"}`} /></button>)}</div>
              <div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" size="sm" className="-ml-2 text-xs" onClick={() => finish("skipped")}>Pular</Button><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{state.step + 1}/{steps.length}</span><Button type="button" variant="outline" size="sm" onClick={() => moveTo(state.step - 1)} disabled={state.step === 0}>Anterior</Button>{state.step < steps.length - 1 ? <Button type="button" size="sm" onClick={() => moveTo(state.step + 1)}>Próximo <ArrowRight className="size-3.5" /></Button> : <Button type="button" size="sm" onClick={() => finish("completed")}>Concluir <Check className="size-3.5" /></Button>}</div></div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
