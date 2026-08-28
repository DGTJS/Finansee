"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type CurrencyInputProps = Omit<ComponentProps<typeof Input>, "type" | "inputMode" | "defaultValue"> & { defaultValue?: string | number };

export function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
}

export function CurrencyInput({ defaultValue = "", onChange, ...props }: CurrencyInputProps) {
  return <MaskedInput defaultValue={formatCurrencyInput(String(defaultValue))} onChange={onChange} {...props} />;
}

function MaskedInput({ defaultValue, onChange, ...props }: CurrencyInputProps) {
  const [value, setValue] = useState(String(defaultValue ?? ""));
  return <Input {...props} type="text" inputMode="decimal" value={value} onChange={(event) => { setValue(formatCurrencyInput(event.target.value)); onChange?.(event); }} />;
}
