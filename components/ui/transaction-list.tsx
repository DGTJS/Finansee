"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Settings2,
  Trash2,
  X,
} from "@/components/icons";
import { BankMark } from "@/components/accounts/bank-mark";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface TransactionListItem {
  id: string;
  name: string;
  type: string;
  amount: number;
  date: string;
  dueDate?: string | null;
  time: string;
  icon: React.ReactNode;
  accountName: string;
  accountImage?: string | null;
  accountType?: string | null;
  status: string;
  paymentMethod?: string;
  source?: string;
  cardLastFour?: string;
  cardType?: "visa" | "mastercard";
}

type TransactionListProps = {
  transactions: TransactionListItem[];
  className?: string;
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  wide?: boolean;
  fixedHeight?: boolean;
  footerLabel?: string;
  footerHref?: string;
  onDelete?: (id: string) => Promise<{ success: boolean; message?: string }>;
  onBulkDelete?: (ids: string[]) => Promise<{ success: boolean; message?: string }>;
  onCancel?: (id: string) => void | Promise<void>;
  onEdit?: (transaction: TransactionListItem) => void;
  deleting?: boolean;
  cancelling?: boolean;
};
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function TransactionList({
  transactions,
  className,
  title = "Transações",
  description,
  toolbar,
  footer,
  compact = false,
  wide = false,
  fixedHeight = false,
  footerLabel = "Ver todas",
  footerHref,
  onDelete,
  onBulkDelete,
  onCancel,
  onEdit,
  deleting = false,
  cancelling = false,
}: TransactionListProps) {
  const effectiveOnDelete = onDelete ?? (onCancel
    ? async (id: string) => {
        await onCancel(id);
        return { success: true };
      }
    : undefined);
  const isDeleting = deleting || cancelling;
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionListItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const visibleIds = transactions.map((transaction) => transaction.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAll = () => setSelectedIds((current) => allSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])]);
  return (
    <div className={cn("w-full font-sans", className)}>
      <motion.div
        className={cn(
          "mx-auto flex min-h-0 w-full flex-col overflow-hidden rounded-3xl bg-background text-foreground shadow-sm",
          wide ? "max-w-none" : "max-w-md",
          compact ? "min-h-[180px]" : "min-h-[420px]",
          fixedHeight && "h-[min(720px,calc(100dvh-180px))]",
        )}
        initial={false}
      >
        <AnimatePresence mode="wait">
          {!selectedTransaction ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="px-6 pt-5">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
                {toolbar && <div className="mt-5">{toolbar}</div>}
                {onBulkDelete && transactions.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Selecionar todos os lançamentos visíveis" className="size-4 accent-primary" />Selecionar todos</label>
                  {selectedIds.length > 0 && <button type="button" className="text-sm font-semibold text-status-danger hover:underline" onClick={() => setBulkDeleteDialogOpen(true)}>Excluir selecionados ({selectedIds.length})</button>}
                </div>}
              </div>
              <div
                className={cn(
                  "space-y-2 p-2",
                  fixedHeight && "min-h-0 flex-1 overflow-y-auto",
                )}
              >
                {transactions.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma movimentação encontrada.
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      role="button"
                      tabIndex={0}
                      layoutId={`transaction-${transaction.id}`}
                      className="flex min-h-14 w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setSelectedTransaction(transaction)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTransaction(transaction);
                        }
                      }}
                    >
                      {onBulkDelete && <input type="checkbox" checked={selectedIds.includes(transaction.id)} aria-label={`Selecionar ${transaction.name}`} onChange={() => toggleSelected(transaction.id)} onClick={(event) => event.stopPropagation()} className="mx-1 size-4 shrink-0 accent-primary" />}
                      <span className="flex min-w-0 items-center gap-3">
                        <motion.span
                          layoutId={`icon-${transaction.id}`}
                          className="relative grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background"
                          transition={{ duration: 0.5 }}
                        >
                          {transaction.icon}
                          <AccountAvatar
                            name={transaction.accountName}
                            type={transaction.accountType}
                            image={transaction.accountImage}
                            compact
                          />
                        </motion.span>
                        <span className="min-w-0">
                          <motion.span
                            layoutId={`name-${transaction.id}`}
                            className="block truncate font-medium text-foreground"
                          >
                            {transaction.name}
                          </motion.span>
                          <motion.span
                            layoutId={`type-${transaction.id}`}
                            className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground"
                          >
                            <span className="truncate">{transaction.type}</span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                statusTone(transaction.status),
                              )}
                            >
                              {transaction.status}
                            </span>
                          </motion.span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <motion.span
                          layoutId={`amount-${transaction.id}`}
                          className={cn(
                            "pl-2 font-bold",
                            transaction.amount >= 0
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {transaction.amount >= 0 ? "+" : "−"}
                          {money.format(Math.abs(transaction.amount))}
                        </motion.span>
                        {effectiveOnDelete && (
                          <button
                            type="button"
                            aria-label={`Excluir ${transaction.name}`}
                            disabled={isDeleting}
                            className="grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTransaction(transaction);
                              setDeleteMessage("");
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
              {footer ?? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mx-auto mb-4 mt-2 w-11/12"
                >
                  <Link
                    href={footerHref ?? "#"}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl bg-accent py-2 text-sm font-medium text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {footerLabel} <ArrowRight className="ml-2 size-4" />
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "p-4",
                fixedHeight && "min-h-0 flex-1 overflow-y-auto",
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.span
                    layoutId={`icon-${selectedTransaction.id}`}
                    className="grid size-10 place-items-center rounded-xl bg-foreground text-background"
                  >
                    {selectedTransaction.icon}
                  </motion.span>
                  <AccountAvatar
                    name={selectedTransaction.accountName}
                    type={selectedTransaction.accountType}
                    image={selectedTransaction.accountImage}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Fechar detalhes"
                  onClick={() => setSelectedTransaction(null)}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-6" />
                </button>
              </div>
              <div className="flex justify-between border-b border-dashed border-border pb-4">
                <div className="space-y-1">
                  <motion.p
                    layoutId={`name-${selectedTransaction.id}`}
                    className="font-medium text-foreground"
                  >
                    {selectedTransaction.name}
                  </motion.p>
                  <motion.p
                    layoutId={`type-${selectedTransaction.id}`}
                    className="text-sm text-muted-foreground"
                  >
                    {selectedTransaction.type}
                  </motion.p>
                </div>
                <motion.p
                  layoutId={`amount-${selectedTransaction.id}`}
                  className="font-bold text-muted-foreground"
                >
                  {selectedTransaction.amount >= 0 ? "+" : "−"}
                  {money.format(Math.abs(selectedTransaction.amount))}
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <p>
                    Competência: {formatBusinessDate(selectedTransaction.date)}
                  </p>
                  {selectedTransaction.dueDate && (
                    <p>
                      Vencimento:{" "}
                      {formatBusinessDate(selectedTransaction.dueDate)}
                    </p>
                  )}
                  <p>Conta responsável: {selectedTransaction.accountName}</p>
                  <p className="flex items-center gap-2">
                    <span>Status</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        statusTone(selectedTransaction.status),
                      )}
                    >
                      {selectedTransaction.status}
                    </span>
                  </p>
                  {selectedTransaction.time && (
                    <p>{selectedTransaction.time}</p>
                  )}
                </div>
                {selectedTransaction.dueDate &&
                  selectedTransaction.status.toLowerCase().includes("pend") && (
                    <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-status-warning">
                        Vencimento
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold text-foreground">
                        {formatBusinessDate(selectedTransaction.dueDate)}
                      </p>
                    </div>
                  )}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <CreditCard className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Pagamento realizado por
                      </p>
                      <p className="truncate font-semibold text-foreground">
                        {selectedTransaction.paymentMethod ??
                          selectedTransaction.accountName}
                      </p>
                    </div>
                  </div>
                  {selectedTransaction.cardLastFour && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Cartão final {selectedTransaction.cardLastFour} ·{" "}
                      {selectedTransaction.cardType ?? "cartão"}
                    </p>
                  )}
                </div>
                {effectiveOnDelete && (
                  <div className="rounded-2xl border border-status-danger/30 bg-status-danger/5 p-4">
                    <button
                      type="button"
                      disabled={isDeleting}
                      className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-status-danger px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        setDeleteMessage("");
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                      {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
                    </button>
                    {deleteMessage && (
                      <p
                        className="mt-2 text-xs text-status-danger"
                        role="alert"
                      >
                        {deleteMessage}
                      </p>
                    )}
                  </div>
                )}
                {onEdit &&
                  !selectedTransaction.status
                    .toLowerCase()
                    .includes("cancel") && (
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => onEdit(selectedTransaction)}
                    >
                      <Settings2 />
                      Editar transação
                    </button>
                  )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {effectiveOnDelete && selectedTransaction && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir “{selectedTransaction.name}”? Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                className="bg-status-danger text-white hover:bg-status-danger/90"
                disabled={isDeleting}
                onClick={async () => {
                  const result = await effectiveOnDelete(selectedTransaction.id);
                  if (result.success) {
                    setDeleteDialogOpen(false);
                    setSelectedTransaction(null);
                  } else {
                    setDeleteDialogOpen(false);
                    setDeleteMessage(result.message ?? "Não foi possível excluir.");
                  }
                }}
              >
                {isDeleting ? "Excluindo..." : "Excluir movimentação"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {onBulkDelete && <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamentos selecionados?</AlertDialogTitle>
            <AlertDialogDescription>Você selecionou {selectedIds.length} lançamento{selectedIds.length === 1 ? "" : "s"}. Eles serão cancelados e os saldos pagos serão ajustados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction type="button" className="bg-status-danger text-white hover:bg-status-danger/90" disabled={isDeleting} onClick={async () => { const result = await onBulkDelete(selectedIds); if (result.success) { setSelectedIds([]); setBulkDeleteDialogOpen(false); } }}>{isDeleting ? "Excluindo..." : "Excluir selecionados"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </div>
  );
}

function AccountAvatar({
  name,
  type,
  image,
  compact = false,
}: {
  name: string;
  type?: string | null;
  image?: string | null;
  compact?: boolean;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const sizeClass = compact
    ? "absolute -bottom-1 -right-1 size-4 text-[7px]"
    : "size-10 text-xs";
  if (type !== "credit_card" && !image)
    return (
      <BankMark
        name={name}
        type={type ?? "checking"}
        className={cn(sizeClass, "rounded-full border border-background")}
      />
    );
  return (
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-full border border-background bg-primary font-display font-semibold text-primary-foreground",
        sizeClass,
      )}
      aria-label={`Conta ${name}`}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          width={compact ? 16 : 40}
          height={compact ? 16 : 40}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("cancel"))
    return "border border-border bg-muted text-foreground";
  return normalized.includes("pend") || normalized.includes("atras")
    ? "border border-status-warning/35 bg-status-warning/15 text-foreground"
    : "border border-status-success/35 bg-status-success/15 text-foreground";
}

function formatBusinessDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "long",
        timeZone: "America/Sao_Paulo",
      }).format(date);
}
