import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) { return clsx(inputs); }
export function formatBRL(cents: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100); }
