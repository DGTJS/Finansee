"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Settings2, Trash2 } from "@/components/icons";
import { createInvestmentPosition, deleteInvestmentPosition, updateInvestmentPosition } from "@/server/actions/investments";
import type { InvestmentPosition } from "@/server/investments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/utils";

const quantityFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export function InvestmentPositions({ spaceId, positions }: { spaceId: string; positions: InvestmentPosition[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<InvestmentPosition | null>(null);
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("spaceId", spaceId);
    startTransition(async () => { const result = editing ? await updateInvestmentPosition(editing.id, form) : await createInvestmentPosition(form); setMessage(result.message ?? ""); if (result.success) { setEditing(null); router.refresh(); } });
  }

  return <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><CardTitle>Minhas posições</CardTitle><CardDescription>O rendimento é calculado comparando o preço médio cadastrado com a cotação atual.</CardDescription></CardHeader><CardContent className="grid gap-3">{positions.length ? positions.map((position) => <div key={position.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{position.symbol}</p><p className="text-xs text-muted-foreground">{quantityFormat.format(position.quantityMilli / 1000)} unidades · adquirido em {position.acquiredAt}</p><p className="mt-2 text-sm">Investido: <strong>{formatBRL(position.investedCents)}</strong></p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="text-right"><p className="text-sm font-semibold">{position.currentCents === null ? "Cotação indisponível" : formatBRL(position.currentCents)}</p>{position.resultPercent !== null && <p className={position.resultCents !== null && position.resultCents >= 0 ? "text-xs font-semibold text-status-success" : "text-xs font-semibold text-status-danger"}>{position.resultCents !== null && position.resultCents >= 0 ? "+" : "−"}{formatBRL(Math.abs(position.resultCents ?? 0))} · {position.resultPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</p>}</div><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" aria-label={`Editar posição ${position.symbol}`} disabled={pending} onClick={() => setEditing(position)}><Settings2 /></Button><Button type="button" variant="ghost" size="icon" className="text-status-danger" aria-label={`Remover posição ${position.symbol}`} disabled={pending} onClick={() => startTransition(async () => { setMessage((await deleteInvestmentPosition(position.id, spaceId)).message ?? ""); router.refresh(); })}><Trash2 /></Button></div></div></div>) : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhuma posição cadastrada. Adicione uma aquisição para acompanhar o rendimento.</p>}{message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}</CardContent></Card><Card><CardHeader><CardTitle>{editing ? "Editar posição" : "Adicionar posição"}</CardTitle><CardDescription>Registre a aquisição com os dados da sua corretora.</CardDescription></CardHeader><CardContent><form key={editing?.id ?? "new"} className="grid gap-4" onSubmit={submit}><label className="grid gap-2"><Label htmlFor="investment-symbol">Código do ativo</Label><Input id="investment-symbol" name="symbol" defaultValue={editing?.symbol ?? ""} required placeholder="Ex.: PETR4" className="h-11 rounded-xl uppercase" /></label><label className="grid gap-2"><Label htmlFor="investment-quantity">Quantidade</Label><Input id="investment-quantity" name="quantity" type="number" min="0.001" step="0.001" defaultValue={editing ? (editing.quantityMilli / 1000).toFixed(3) : undefined} required placeholder="0,000" className="h-11 rounded-xl" /></label><label className="grid gap-2"><Label htmlFor="investment-price">Preço médio (R$)</Label><Input id="investment-price" name="averagePrice" defaultValue={editing ? (editing.averagePriceCents / 100).toFixed(2) : undefined} required placeholder="0,00" className="h-11 rounded-xl" /></label><label className="grid gap-2"><Label htmlFor="investment-date">Data de aquisição</Label><Input id="investment-date" name="acquiredAt" type="date" defaultValue={editing?.acquiredAt} required className="h-11 rounded-xl" /></label><div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? "Salvando..." : editing ? "Atualizar posição" : "Adicionar posição"}</Button>{editing && <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>}</div></form></CardContent></Card></section>;
}
