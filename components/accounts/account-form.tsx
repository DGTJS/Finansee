"use client";

import { useState } from "react";
import { BankMark } from "@/components/accounts/bank-mark";
import { Check, CreditCard, Wallet } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";

export type AccountType = "checking" | "credit_card" | "savings" | "cash";
export type AccountRecord = { id: string; name: string; bank?: string; type: string; balanceCents: number; financialSpaceId: string; color: string; closingDay: number | null; dueDay: number | null; createdAt: Date; updatedAt: Date };

const colors = [
  { id: "lime", label: "Lima", value: "#b8f34b", text: "#17210b" },
  { id: "violet", label: "Violeta", value: "#8d72e8", text: "#ffffff" },
  { id: "ocean", label: "Oceano", value: "#3e9ee8", text: "#ffffff" },
  { id: "coral", label: "Coral", value: "#e87968", text: "#ffffff" },
  { id: "ink", label: "Grafite", value: "#242a27", text: "#ffffff" },
];
const accountTypes: { id: AccountType; label: string; description: string }[] = [
  { id: "checking", label: "Débito", description: "Conta para movimentação diária" },
  { id: "credit_card", label: "Crédito", description: "Cartão com fatura e vencimento" },
  { id: "savings", label: "Poupança", description: "Reserva e dinheiro guardado" },
  { id: "cash", label: "Dinheiro", description: "Valor em espécie" },
];
const banks = ["Nubank", "Itaú", "Bradesco", "Santander", "Swile", "PicPay", "Inter", "Outro"];

function bankFromName(name: string) {
  const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const match = banks.find((bank) => bank !== "Outro" && normalizedName.includes(bank.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  return match ?? (name ? "Outro" : "Nubank");
}

export function AccountForm({ account, pending, onSubmit, onCancel }: { account?: AccountRecord; pending: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>, type: AccountType, color: string) => void; onCancel: () => void }) {
  const [type, setType] = useState<AccountType>((account?.type as AccountType | undefined) ?? "checking");
  const [color, setColor] = useState(account?.color || "lime");
  const [bank, setBank] = useState(bankFromName(account?.bank && account.bank !== "Outro" ? account.bank : account?.name || ""));
  const [name, setName] = useState(account?.name ?? "");
  const selectedColor = colors.find((item) => item.id === color) ?? colors[0];
  const isCredit = type === "credit_card";
  return <form className="grid gap-6" onSubmit={(event) => onSubmit(event, type, color)}><input type="hidden" name="bank" value={bank} />
    <div className="relative overflow-hidden rounded-[1.5rem] p-5 text-white shadow-xl transition-colors duration-300" style={{ background: `linear-gradient(135deg, ${selectedColor.value}, color-mix(in srgb, ${selectedColor.value} 48%, #111411))`, color: selectedColor.text }}><div className="absolute -right-10 -top-12 size-36 rounded-full border border-white/20" /><div className="absolute -bottom-16 right-10 size-44 rounded-full border border-white/10" /><div className="relative flex items-start justify-between gap-4"><div className="flex items-center gap-3"><BankMark name={bank} type={type} className="bg-white/20 text-current" /><span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Finansee</span></div><span className="rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">{isCredit ? "Crédito" : "Débito"}</span></div><p className="relative mt-12 truncate text-lg font-semibold">{name || "Nome da conta"}</p><p className="relative mt-1 text-xs opacity-75">{isCredit ? "Cartão de crédito" : "Conta financeira"}</p></div>
    <div className="grid gap-3"><Label>Banco ou marca</Label><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{banks.map((item) => { const active = bank === item; return <button key={item} type="button" aria-pressed={active} onClick={() => { setBank(item); if (!name || banks.some((known) => name.toLowerCase().startsWith(known.toLowerCase()))) setName(item === "Outro" ? "" : item); }} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-colors ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}><BankMark name={item} type={type} className="size-7 rounded-lg [&_svg]:size-4" /><span className="truncate">{item}</span></button>; })}</div></div>
    <div className="grid gap-2"><Label htmlFor="account-name">Nome da conta ou cartão</Label><Input id="account-name" name="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} placeholder="Ex.: Nubank principal" className="h-12 rounded-xl" /><p className="text-xs text-muted-foreground">Este é o nome que aparecerá em lançamentos e transferências.</p></div>
    <fieldset className="grid gap-3"><legend className="text-sm font-semibold">Como você usa este meio?</legend><div className="grid gap-2 sm:grid-cols-2">{accountTypes.map((item) => { const active = type === item.id; return <button key={item.id} type="button" aria-pressed={active} onClick={() => setType(item.id)} className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-all ${active ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]" : "border-border bg-card hover:border-primary/50"}`}><span className={`grid size-9 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{item.id === "credit_card" ? <CreditCard /> : <Wallet />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="block truncate text-xs text-muted-foreground">{item.description}</span></span>{active && <Check className="size-4 text-primary" />}</button>; })}</div></fieldset>
    <fieldset className="grid gap-3"><legend className="text-sm font-semibold">Cor do cartão</legend><div className="flex flex-wrap gap-3">{colors.map((item) => <button key={item.id} type="button" aria-label={`Usar cor ${item.label}`} aria-pressed={color === item.id} onClick={() => setColor(item.id)} className={`grid size-10 place-items-center rounded-full border-2 transition-transform hover:scale-105 ${color === item.id ? "border-foreground ring-2 ring-primary ring-offset-2 ring-offset-card" : "border-transparent"}`} style={{ backgroundColor: item.value }}>{color === item.id && <Check className="size-4" style={{ color: item.text }} />}</button>)}</div></fieldset>
    <div className="grid gap-4 rounded-2xl border border-border bg-muted/35 p-4"><div className="grid gap-2"><Label htmlFor="account-balance">Saldo inicial (R$)</Label><CurrencyInput id="account-balance" name="balance" defaultValue={account ? (account.balanceCents / 100).toFixed(2) : "0.00"} required className="h-12 rounded-xl bg-card" /></div>{isCredit && <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="account-closing-day">Fechamento</Label><Input id="account-closing-day" name="closingDay" type="number" min="1" max="31" defaultValue={account?.closingDay ?? ""} required className="h-12 rounded-xl bg-card" /></div><div className="grid gap-2"><Label htmlFor="account-due-day">Vencimento</Label><Input id="account-due-day" name="dueDay" type="number" min="1" max="31" defaultValue={account?.dueDay ?? ""} required className="h-12 rounded-xl bg-card" /></div></div>}</div>
    <div className="flex flex-col-reverse gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={onCancel} disabled={pending} className="sm:flex-1">Cancelar</Button><Button type="submit" loading={pending} className="sm:flex-[1.5]">{pending ? "Salvando conta..." : account ? "Atualizar conta" : "Adicionar conta"}</Button></div>
  </form>;
}
