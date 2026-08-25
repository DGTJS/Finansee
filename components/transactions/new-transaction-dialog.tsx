"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Plus,
  WalletCards,
  X,
} from "@/components/icons";
import {
  createTransaction,
  updateTransaction,
} from "@/server/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getBusinessDate } from "@/lib/business-date";
import { BankMark } from "@/components/accounts/bank-mark";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
type FieldName =
  | "date"
  | "description"
  | "kind"
  | "account"
  | "category"
  | "source"
  | "amount";
type FieldErrors = Partial<Record<FieldName, string>>;
type Option = {
  value: string;
  label: string;
  type?: string;
  bank?: string | null;
};
const sourceOptions: Option[] = [
  { value: "Vale alimentação (VA)", label: "Vale alimentação (VA)" },
  { value: "Vale refeição (VR)", label: "Vale refeição (VR)" },
  { value: "Vale transporte (VT)", label: "Vale transporte (VT)" },
  { value: "Benefício flexível", label: "Benefício flexível" },
  { value: "Salário", label: "Salário" },
  { value: "custom", label: "Outro / informar manualmente" },
];

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits
    ? (Number(digits) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
}
function ErrorText({ children }: { children?: string }) {
  return children ? (
    <span className="text-xs font-normal text-status-danger">{children}</span>
  ) : null;
}
function SelectField({
  value,
  onValueChange,
  options,
  error,
  icon: Icon,
  showBank = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  error?: string;
  icon: typeof WalletCards;
  showBank?: boolean;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <Select value={value} onValueChange={(next) => next && onValueChange(next)}>
      <SelectTrigger
        aria-invalid={Boolean(error)}
        className={cn(
          "!h-16 min-h-16 w-full rounded-2xl border-border/80 bg-background px-3 text-left text-sm shadow-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
          error && "border-status-danger focus-visible:ring-status-danger/20",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors",
              selected && "bg-primary/12 text-primary",
            )}
          >
            {showBank && selected ? (
              <BankMark
                name={selected.bank ?? selected.label}
                type={selected.type ?? "checking"}
                className="size-10 rounded-xl"
              />
            ) : (
              <Icon className="size-5" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {selected ? "Selecionado" : "Escolha uma opção"}
            </span>
            <SelectValue className="mt-0.5 block !line-clamp-none whitespace-normal font-medium text-foreground">
              {selected?.label ?? "Selecione uma opção"}
            </SelectValue>
          </span>
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-border/80 p-1.5 shadow-xl">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="rounded-xl py-2.5 pl-9 pr-3 focus:bg-primary/10 focus:text-foreground"
            >
              <span className="flex min-w-0 items-center gap-3">
                <>
                  {showBank ? (
                    <BankMark
                      name={option.bank ?? option.label}
                      type={option.type ?? "checking"}
                      className="size-9 rounded-lg"
                    />
                  ) : null}
                </>
                <span className="truncate">{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
function CalendarStep({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const selected = new Date(`${selectedDate}T12:00:00`);
  const [visibleDate, setVisibleDate] = useState(() =>
    Number.isNaN(selected.getTime()) ? new Date() : selected,
  );
  const month = visibleDate.getMonth();
  const year = visibleDate.getFullYear();
  const days = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(first).fill(null),
      ...Array.from({ length: total }, (_, i) => i + 1),
    ];
  }, [month, year]);
  function moveMonth(offset: number) {
    setVisibleDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mês anterior"
          onClick={() => moveMonth(-1)}
        >
          <ChevronDown className="-rotate-90" />
        </Button>
        <p className="font-display text-base font-semibold">
          {monthNames[month]} {year}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Próximo mês"
          onClick={() => moveMonth(1)}
        >
          <ChevronDown className="rotate-90" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
        {weekDays.map((day, i) => (
          <span key={`${day}-${i}`} className="py-1">
            {day}
          </span>
        ))}
        {days.map((day, i) => {
          const value = day
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : "";
          return (
            <button
              key={`${value}-${i}`}
              type="button"
              disabled={!day}
              onClick={() => day && onSelect(value)}
              className={cn(
                "grid aspect-square place-items-center rounded-lg text-sm transition-colors",
                !day && "pointer-events-none",
                day && "hover:bg-muted",
                value === selectedDate &&
                  "bg-primary font-semibold text-primary-foreground hover:bg-primary",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type TransactionAccountOption = {
  value: string;
  label: string;
  type: string;
  bank?: string | null;
};
type TransactionCategoryOption = { value: string; label: string; kind: string };
type EditableTransaction = {
  id: string;
  date: string;
  description: string;
  kind: string;
  source: string | null;
  amountCents: number;
  accountId: string;
  categoryId: string;
};

export function NewTransactionDialog({
  className,
  onCreated,
  onUpdated,
  spaceId = "personal-space",
  accounts = [],
  categories = [],
  initialTransaction,
  open: controlledOpen,
  onOpenChange,
}: {
  className?: string;
  onCreated?: () => void;
  onUpdated?: () => void;
  spaceId?: string;
  accounts?: TransactionAccountOption[];
  categories?: TransactionCategoryOption[];
  initialTransaction?: EditableTransaction | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const editing = Boolean(initialTransaction);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [date, setDate] = useState(initialTransaction?.date ?? getBusinessDate);
  const [description, setDescription] = useState(
    initialTransaction?.description ?? "",
  );
  const [kind, setKind] = useState(initialTransaction?.kind ?? "expense");
  const [source, setSource] = useState(initialTransaction?.source ?? "");
  const [sourceChoice, setSourceChoice] = useState(
    initialTransaction?.source &&
      sourceOptions.some((option) => option.value === initialTransaction.source)
      ? initialTransaction.source
      : initialTransaction?.source
        ? "custom"
        : "",
  );
  const [amount, setAmount] = useState(
    initialTransaction
      ? (Math.abs(initialTransaction.amountCents) / 100).toLocaleString(
          "pt-BR",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        )
      : "",
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const accountOptions = accounts;
  const categoryOptions = categories.filter((option) => option.kind === kind);
  const [account, setAccount] = useState(
    initialTransaction?.accountId ?? accounts[0]?.value ?? "",
  );
  const [category, setCategory] = useState(
    initialTransaction?.categoryId ??
      categories.find((option) => option.kind === kind)?.value ??
      "",
  );
  function reset() {
    setOpen(false);
    setStep(1);
    setMessage("");
    setDescription("");
    setSource("");
    setSourceChoice("");
    setAmount("");
    setErrors({});
  }
  function clearError(field: FieldName) {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }
  function nextStep() {
    const next: FieldErrors = {};
    if (step === 1 && !date) next.date = "Selecione uma data.";
    if (step === 2) {
      if (!description.trim())
        next.description = "Informe o nome da movimentação.";
      if (!kind) next.kind = "Selecione o tipo.";
      if (!account) next.account = "Selecione a conta.";
      if (!category) next.category = "Selecione a categoria.";
      if (kind === "income" && !source.trim())
        next.source = "Informe a origem da receita.";
    }
    setErrors(next);
    if (!Object.keys(next).length) setStep((v) => Math.min(3, v + 1));
  }
  async function submit() {
    const numericAmount = amount.replace(/\./g, "").replace(",", ".");
    if (!amount || Number(numericAmount) <= 0) {
      setErrors({ amount: "Informe um valor maior que zero." });
      return;
    }
    const formData = new FormData();
    formData.set("description", description);
    formData.set("source", source);
    formData.set("amount", numericAmount);
    formData.set("kind", kind);
    formData.set("competenceDate", date);
    formData.set("accountId", account);
    formData.set("categoryId", category);
    formData.set("spaceId", spaceId);
    setPending(true);
    const result =
      editing && initialTransaction
        ? await updateTransaction(initialTransaction.id, formData)
        : await createTransaction(formData);
    setPending(false);
    setMessage(result.message);
    if (result.success) {
      (editing ? onUpdated : onCreated)?.();
      setTimeout(reset, 700);
    }
  }
  const accountLabel =
    accountOptions.find((option) => option.value === account)?.label ??
    "Nenhuma conta selecionada";
  return (
    <Drawer
      open={open}
      onOpenChange={(value) => (value ? setOpen(true) : reset())}
    >
      <DrawerTrigger
        render={
          <Button className={cn("shrink-0 whitespace-nowrap", className)}>
            <Plus data-icon="inline-start" />
            Nova transação
          </Button>
        }
      />
      <DrawerContent className="mx-auto max-h-[min(94dvh,760px)] bg-card text-card-foreground lg:inset-x-0 lg:bottom-0 lg:left-0 lg:right-0 lg:top-auto lg:mx-auto lg:h-[70dvh] lg:w-[min(calc(100vw-4rem),1200px)] lg:max-h-[70dvh] lg:rounded-2xl lg:border lg:border-border lg:[--translate-x:0px] lg:[--translate-y:0px]">
        <DrawerHeader className="px-5 pb-0 text-left sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DrawerTitle className="sr-only">Nova transação</DrawerTitle>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Etapa {step} de 3
              </p>
              <DrawerDescription className="sr-only">
                Cadastro de uma nova transação financeira.
              </DrawerDescription>
            </div>
            <DrawerClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Fechar modal"
                >
                  <X />
                </Button>
              }
            />
          </div>
          <Progress value={(step / 3) * 100} className="mt-5 h-1.5" />
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-2 sm:px-7">
          {step === 1 && (
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <CalendarDays />
                </span>
                <div>
                  <p className="text-sm font-semibold">Data da movimentação</p>
                  <p className="text-xs text-muted-foreground">
                    Selecione a data de competência.
                  </p>
                </div>
              </div>
              <CalendarStep
                selectedDate={date}
                onSelect={(value) => {
                  setDate(value);
                  clearError("date");
                }}
              />
              {errors.date && <ErrorText>{errors.date}</ErrorText>}
            </div>
          )}
          {step === 2 && (
            <div className="mt-5 flex flex-col gap-5">
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <WalletCards />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      Dê contexto ao lançamento
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Escolha um nome curto e indique onde o dinheiro entrou ou
                      saiu.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="transaction-description">
                  Nome da movimentação
                </Label>
                <Input
                  id="transaction-description"
                  autoFocus
                  required
                  aria-invalid={Boolean(errors.description)}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    clearError("description");
                  }}
                  placeholder="Ex.: Mercado da semana"
                  className={cn(
                    "h-12 rounded-xl px-4",
                    errors.description && "border-status-danger",
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Use um nome que você reconheça rapidamente no extrato.
                </p>
                <ErrorText>{errors.description}</ErrorText>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tipo de movimentação</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={kind === "expense" ? "default" : "outline"}
                    aria-pressed={kind === "expense"}
                    onClick={() => {
                      setKind("expense");
                      setCategory(
                        categories.find((option) => option.kind === "expense")
                          ?.value ?? "",
                      );
                      clearError("kind");
                    }}
                    className={cn(
                      "h-auto min-h-20 justify-start gap-3 rounded-2xl px-4 text-left",
                      kind === "expense" &&
                        "bg-status-danger text-white hover:bg-status-danger/90",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background/20">
                      <ArrowDownRight />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        Despesa
                      </span>
                      <span className="mt-1 block text-xs font-normal opacity-75">
                        Dinheiro que saiu
                      </span>
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={kind === "income" ? "default" : "outline"}
                    aria-pressed={kind === "income"}
                    onClick={() => {
                      setKind("income");
                      setCategory(
                        categories.find((option) => option.kind === "income")
                          ?.value ?? "",
                      );
                      clearError("kind");
                    }}
                    className={cn(
                      "h-auto min-h-20 justify-start gap-3 rounded-2xl px-4 text-left",
                      kind === "income" &&
                        "bg-status-success text-white hover:bg-status-success/90",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background/20">
                      <ArrowUpRight />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        Receita
                      </span>
                      <span className="mt-1 block text-xs font-normal opacity-75">
                        Dinheiro que entrou
                      </span>
                    </span>
                  </Button>
                </div>
                <ErrorText>{errors.kind}</ErrorText>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Conta
                  </Label>
                  <SelectField
                    value={account}
                    onValueChange={(value) => {
                      setAccount(value);
                      clearError("account");
                    }}
                    error={errors.account}
                    options={accountOptions}
                    icon={WalletCards}
                    showBank
                  />
                  <ErrorText>{errors.account}</ErrorText>
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Categoria
                  </Label>
                  <SelectField
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value);
                      clearError("category");
                    }}
                    error={errors.category}
                    options={categoryOptions}
                    icon={BarChart3}
                  />
                  <ErrorText>{errors.category}</ErrorText>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/25 p-4">
                <div className="mb-3">
                  <Label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Conta ou benefício de origem
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use também VR, VA, VT e outros benefícios.
                  </p>
                </div>
                <SelectField
                  value={sourceChoice}
                  onValueChange={(value) => {
                    setSourceChoice(value);
                    setSource(value === "custom" ? "" : value);
                    clearError("source");
                  }}
                  error={errors.source}
                  options={sourceOptions}
                  icon={WalletCards}
                />
                {sourceChoice === "custom" && (
                  <Input
                    id="transaction-source"
                    required={kind === "income"}
                    aria-invalid={Boolean(errors.source)}
                    value={source}
                    onChange={(event) => {
                      setSource(event.target.value);
                      clearError("source");
                    }}
                    placeholder="Ex.: Empresa, cartão benefício ou outra origem"
                    className={cn(
                      "mt-3 h-12 rounded-xl bg-background",
                      errors.source && "border-status-danger",
                    )}
                  />
                )}
                <ErrorText>{errors.source}</ErrorText>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="mt-6">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Conta selecionada
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-card text-muted-foreground">
                    <CalendarDays />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{accountLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {kind === "income" ? "Receita" : "Despesa"} ·{" "}
                      {description || "Sem nome"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Label htmlFor="transaction-amount">Valor da transação</Label>
                <div
                  className={cn(
                    "flex items-center rounded-2xl border bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                    errors.amount ? "border-status-danger" : "border-border",
                  )}
                >
                  <span className="font-display text-2xl font-semibold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="transaction-amount"
                    autoFocus
                    required
                    inputMode="decimal"
                    aria-invalid={Boolean(errors.amount)}
                    value={amount}
                    onChange={(event) => {
                      setAmount(formatAmountInput(event.target.value));
                      clearError("amount");
                    }}
                    placeholder="0,00"
                    className="h-16 border-0 bg-transparent px-3 font-display text-3xl font-semibold shadow-none focus-visible:ring-0"
                  />
                </div>
                <ErrorText>{errors.amount}</ErrorText>
              </div>
            </div>
          )}
          {message && (
            <p className="mt-4 rounded-xl bg-status-success/10 px-3 py-2 text-sm text-status-success">
              {message}
            </p>
          )}
        </div>
        <DrawerFooter className="border-t border-border px-5 pt-4 sm:px-7">
          <div className="flex w-full flex-row gap-3">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 flex-1"
              onClick={
                step === 1 ? reset : () => setStep((v) => Math.max(1, v - 1))
              }
            >
              {step === 1 ? "Cancelar" : "Voltar"}
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                className="min-h-11 flex-1"
                onClick={nextStep}
              >
                Continuar{" "}
                <ChevronDown className="-rotate-90" data-icon="inline-end" />
              </Button>
            ) : (
              <Button
                type="button"
                className="min-h-11 flex-1"
                disabled={pending}
                onClick={submit}
              >
                {pending ? "Salvando..." : "Salvar transação"}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
