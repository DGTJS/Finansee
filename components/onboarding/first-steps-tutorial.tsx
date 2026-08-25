"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  LayoutDashboard,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type TutorialStatus = "active" | "completed" | "skipped";
type TutorialState = { status: TutorialStatus; step: number };

const steps = [
  { title: "Seu panorama financeiro", eyebrow: "Dashboard", description: "Comece pela visão geral: saldo, fluxo de caixa, contas a pagar e a saúde financeira do seu espaço.", href: "/", action: "Ver dashboard", icon: LayoutDashboard, color: "from-lime-300/30 to-emerald-400/10" },
  { title: "Contas e cartões", eyebrow: "Contas", description: "Cadastre contas, cartões e saldos iniciais. É aqui que cada movimentação ganha um lugar certo.", href: "/accounts", action: "Explorar contas", icon: CreditCard, color: "from-sky-300/30 to-blue-500/10" },
  { title: "Movimente seu dinheiro", eyebrow: "Transações", description: "Registre receitas, despesas e transferências para manter o saldo e o mês sempre atualizados.", href: "/transactions", action: "Abrir transações", icon: Wallet, color: "from-amber-300/30 to-orange-400/10" },
  { title: "Planeje os próximos passos", eyebrow: "Planejamento", description: "Use orçamentos e metas para transformar seus planos em decisões acompanháveis.", href: "/planning", action: "Abrir planejamento", icon: Target, color: "from-violet-300/30 to-fuchsia-400/10" },
  { title: "Acompanhe investimentos", eyebrow: "Investimentos", description: "Visualize suas posições e acompanhe o patrimônio investido em um só lugar.", href: "/investments", action: "Ver investimentos", icon: TrendingUp, color: "from-cyan-300/30 to-teal-400/10" },
  { title: "Leia o seu histórico", eyebrow: "Relatórios", description: "Compare períodos e encontre padrões para tomar decisões com mais clareza.", href: "/reports", action: "Abrir relatórios", icon: BarChart3, color: "from-rose-300/30 to-red-400/10" },
  { title: "Deixe tudo do seu jeito", eyebrow: "Configurações", description: "Gerencie seu perfil, membros, rendas e permissões do espaço financeiro.", href: "/settings", action: "Abrir configurações", icon: Settings, color: "from-slate-300/30 to-slate-500/10" },
] as const;

const defaultState: TutorialState = { status: "active", step: 0 };

function readState(key: string): TutorialState {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<TutorialState>;
    return { status: parsed.status === "completed" || parsed.status === "skipped" ? parsed.status : "active", step: Math.min(Math.max(Number(parsed.step) || 0, 0), steps.length - 1) };
  } catch {
    return defaultState;
  }
}

export function FirstStepsTutorial({ userId }: { userId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const storageKey = `finansee:onboarding:${userId}`;
  const [state, setState] = useState<TutorialState>(() => typeof window === "undefined" ? defaultState : readState(storageKey));
  const [open, setOpen] = useState(() => typeof window !== "undefined" && readState(storageKey).status === "active");
  const current = steps[state.step];
  const CurrentIcon = current.icon;

  function save(nextState: TutorialState) {
    setState(nextState);
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  }

  function finish(status: "completed" | "skipped") {
    save({ status, step: steps.length - 1 });
    setOpen(false);
  }

  function moveTo(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), steps.length - 1);
    save({ status: "active", step: nextIndex });
    setOpen(true);
    if (steps[nextIndex].href !== pathname) router.push(steps[nextIndex].href);
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) finish("skipped"); else setOpen(true); }}>
      <DialogContent showCloseButton={false} className="overflow-hidden border border-foreground/10 bg-popover p-0 shadow-2xl shadow-foreground/15 sm:w-[min(calc(100vw-2rem),46rem)]">
        <div className={`relative overflow-hidden bg-gradient-to-br ${current.color} px-5 pb-6 pt-6 sm:px-8 sm:pt-8`}>
          <div className="absolute -right-16 -top-20 size-52 rounded-full border border-foreground/10" />
          <div className="absolute -right-5 -top-9 size-32 rounded-full border border-foreground/10" />
          <DialogHeader className="relative">
            <div className="flex items-start justify-between gap-5">
              <motion.div key={current.href} initial={{ opacity: 0, scale: 0.8, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="grid size-12 place-items-center rounded-2xl border border-foreground/10 bg-background/60 shadow-sm backdrop-blur">
                <CurrentIcon className="size-5" />
              </motion.div>
              <span className="rounded-full border border-foreground/10 bg-background/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Finansee · primeiros passos</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={current.href} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                <DialogTitle className="mt-6 max-w-sm text-2xl leading-tight sm:text-3xl">{current.title}</DialogTitle>
                <DialogDescription className="mt-3 max-w-lg text-sm leading-6">{current.description}</DialogDescription>
              </motion.div>
            </AnimatePresence>
          </DialogHeader>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex items-center gap-2" aria-label={`Passo ${state.step + 1} de ${steps.length}`}>
            {steps.map((item, index) => (
              <button key={item.href} type="button" aria-label={`Ir para ${item.eyebrow}`} onClick={() => moveTo(index)} className="group flex flex-1 items-center gap-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <span className={`h-1.5 w-full rounded-full transition-colors ${index <= state.step ? "bg-primary" : "bg-muted"}`} />
                <span className="sr-only">{item.eyebrow}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{current.eyebrow}</span>
            <span>{state.step + 1} / {steps.length}</span>
          </div>
        </div>

        <DialogFooter className="-mx-0 -mb-0 rounded-none border-t border-border bg-muted/35 px-5 py-4 sm:px-8">
          <Button type="button" variant="ghost" className="sm:mr-auto" onClick={() => finish("skipped")}>Pular tutorial</Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => moveTo(state.step - 1)} disabled={state.step === 0}>Anterior</Button>
            {state.step < steps.length - 1 ? <Button type="button" onClick={() => moveTo(state.step + 1)}>Próximo <ArrowRight className="size-4" /></Button> : <Button type="button" onClick={() => finish("completed")}>Concluir <Check className="size-4" /></Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
