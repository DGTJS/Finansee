"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBusinessMonth } from "@/lib/business-date";

export function MonthSelector({ value = getBusinessMonth() }: { value?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const months = Array.from({ length: 6 }, (_, index) => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - index); const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date); return [month, label.charAt(0).toUpperCase() + label.slice(1)] as const; });
  const label = months.find(([month]) => month === value)?.[1] ?? formatMonth(value);

  function changeMonth(month: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    router.push(`/?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={(month) => month && changeMonth(month)}>
      <SelectTrigger className="h-10 w-fit min-w-36 rounded-xl bg-card px-3 shadow-sm" aria-label="Selecionar mês">
        <span className="size-2 rounded-full bg-primary" />
        <SelectValue>{label}</SelectValue>
        <ChevronDown data-icon="inline-end" />
      </SelectTrigger>
      <SelectContent>
        {months.map(([month, monthLabel]) => (
          <SelectItem key={month} value={month}>{monthLabel}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return "Selecione o mês";
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
