"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AccountSelect({ label, value, options, onChange }: { label: string; value: string; options: { id: string; name: string }[]; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><Label>{label}</Label><Select value={value} onValueChange={(next) => next && onChange(next)}><SelectTrigger className="h-12 w-full rounded-xl"><SelectValue>{options.find((account) => account.id === value)?.name ?? "Selecione a conta"}</SelectValue></SelectTrigger><SelectContent>{options.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent></Select></label>;
}
