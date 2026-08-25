export type TransactionStatus = "pending" | "paid" | "overdue" | "cancelled";

export function parseAmountCents(value: string | number, options: { allowZero?: boolean } = {}) {
  const raw = typeof value === "number" ? value.toFixed(2) : value.trim();
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || (!options.allowZero && amount === 0)) throw new Error("INVALID_AMOUNT");
  return Math.round(amount * 100);
}

export function splitInstallments(totalCents: number, installments: number) {
  if (!Number.isInteger(totalCents) || totalCents <= 0 || !Number.isInteger(installments) || installments <= 0) throw new Error("INVALID_INSTALLMENTS");
  const base = Math.floor(totalCents / installments);
  const remainder = totalCents - base * installments;
  return Array.from({ length: installments }, (_, index) => base + (index === 0 ? remainder : 0));
}

export function resolveTransactionStatus(status: TransactionStatus, dueDate: string | null, today: string) {
  if (status !== "pending" || !dueDate || dueDate >= today) return status;
  return "overdue" as const;
}

export function isIncludedInBalance(status: TransactionStatus) {
  return status === "paid";
}

export function isIncludedInForecast(status: TransactionStatus) {
  return status === "paid" || status === "pending" || status === "overdue";
}
