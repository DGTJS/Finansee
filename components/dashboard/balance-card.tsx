"use client";

import { useState } from "react";
import { Eye, Users, WalletCards } from "@/components/icons";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

export function BalanceCard({ balanceCents, forecastCents, combinedBalanceCents, combinedForecastCents, initialMode = "individual", allowModeToggle = true, spaceId = "personal-space", accounts, categories }: { balanceCents: number; forecastCents: number; combinedBalanceCents: number; combinedForecastCents: number; initialMode?: "individual" | "combined"; allowModeToggle?: boolean; spaceId?: string; accounts: { value: string; label: string; type: string }[]; categories: { value: string; label: string; kind: string }[] }) {
  const [mode, setMode] = useState<"individual" | "combined">(initialMode);
  const isCombined = mode === "combined";

  return (
    <Card className="balance-card relative min-h-[218px] overflow-visible bg-sidebar text-sidebar-foreground sm:min-h-[240px]">
      <div className="flex items-start justify-between gap-4 p-6 sm:p-7">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-sidebar-foreground/65"><WalletCards />Saldo em conta</p>
          <p className="mt-5 truncate font-display text-4xl font-semibold tracking-tight text-sidebar-foreground sm:text-5xl">{formatBRL(isCombined ? combinedBalanceCents : balanceCents)}</p>
          <p className="mt-2 text-sm text-sidebar-foreground/65">{isCombined ? "Visão conjunta do espaço" : "Visão individual"}</p>
        </div>
        {allowModeToggle && <button type="button" aria-pressed={isCombined} aria-label={isCombined ? "Ver saldo individual" : "Ver saldo conjunto"} onClick={() => setMode(isCombined ? "individual" : "combined")} className="balance-mode-toggle flex shrink-0 items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent px-2 py-2 text-xs font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-foreground hover:text-sidebar sm:px-3">
          <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">{isCombined ? <Users /> : <Eye />}</span>
          <span className="hidden sm:inline">{isCombined ? "Conjunto" : "Individual"}</span>
        </button>}
      </div>
      <div className="mx-6 flex max-w-[230px] flex-col gap-1 border-t border-sidebar-border pt-4 text-xs sm:mx-7"><span className="text-sidebar-foreground/55">Saldo previsto</span><strong className="text-sm font-semibold text-sidebar-foreground">{formatBRL(isCombined ? combinedForecastCents : forecastCents)}</strong></div>
      <div className="balance-card-action"><NewTransactionDialog className="balance-action-button" spaceId={spaceId} accounts={accounts} categories={categories} /></div>
    </Card>
  );
}
