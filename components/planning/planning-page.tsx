"use client";

import { useState, useTransition } from "react";
import {
  BarChart3,
  Bell,
  CircleCheck,
  Plus,
  Settings2,
  Target,
  Trash2,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import {
  createBudget,
  createGoal,
  deleteBudget,
  deleteGoal,
  updateBudget,
  updateGoal,
} from "@/server/actions/planning";
import { formatBRL } from "@/lib/utils";
import { ScheduledOperations } from "@/components/planning/scheduled-operations";
import { MetricCard } from "@/components/dashboard/metric-card";

type Data = {
  budgets: {
    id: string;
    categoryId: string;
    month: string;
    limitCents: number;
    categoryName: string | null;
  }[];
  goals: {
    id: string;
    name: string;
    targetCents: number;
    currentCents: number;
    dueDate: string | null;
  }[];
  alerts: {
    id: string;
    title: string;
    body: string;
    severity: string;
    readAt: Date | null;
  }[];
  categories: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
  recurrences: {
    id: string;
    description: string;
    kind: string;
    frequency: string;
    nextDate: string;
    endDate: string | null;
    active: boolean;
  }[];
};

export function PlanningPage({
  data,
  spaceId = "personal-space",
}: {
  data: Data;
  spaceId?: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  function run(
    action: () => Promise<{ success: boolean; message?: string }>,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.message ?? "");
      if (result.success) onSuccess?.();
    });
  }
  const goalProgress = data.goals.length
    ? Math.round(
        data.goals.reduce(
          (sum, goal) =>
            sum +
            Math.min(
              100,
              (goal.currentCents / Math.max(goal.targetCents, 1)) * 100,
            ),
          0,
        ) / data.goals.length,
      )
    : 0;
  return (
    <main className="min-h-screen bg-background lg:pl-64">
      <div className="mx-auto max-w-[1200px] px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-24">
        <header className="border-b border-border pb-8">
          <p className="text-sm font-medium text-primary">
            Seu dinheiro, no seu ritmo
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Vamos planejar?
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Escolha um próximo passo e deixe o Finansee acompanhar o caminho com
            você.
          </p>
        </header>
        {message && (
          <p
            className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm"
            role="status"
          >
            {message}
          </p>
        )}
        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <ActionCard
            icon={Target}
            eyebrow="Objetivo"
            title="Guardar para algo"
            description="Crie uma meta e acompanhe seu progresso."
            onClick={() => {
              setEditingGoal(null);
              setGoalOpen(true);
            }}
          />
          <ActionCard
            icon={BarChart3}
            eyebrow="Limite mensal"
            title="Organizar gastos"
            description="Defina quanto quer gastar em cada categoria."
            onClick={() => {
              setEditingBudget(null);
              setBudgetOpen(true);
            }}
          />
          <ActionCard
            icon={Bell}
            eyebrow="Atenção"
            title={
              data.alerts.length
                ? `${data.alerts.length} alerta${data.alerts.length === 1 ? "" : "s"} para ver`
                : "Tudo tranquilo"
            }
            description={
              data.alerts.length
                ? "Veja o que merece sua atenção hoje."
                : "Nenhum aviso importante por enquanto."
            }
            onClick={() =>
              document
                .getElementById("planning-alerts")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            tone={data.alerts.length ? "warning" : "default"}
          />
        </section>
        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Metas ativas"
            value={String(data.goals.length)}
            detail={
              data.goals.length
                ? `${goalProgress}% de progresso médio`
                : "Comece um objetivo"
            }
            icon={Target}
            tone="lime"
          />
          <MetricCard
            label="Limites definidos"
            value={String(data.budgets.length)}
            detail="por categoria"
            icon={BarChart3}
            tone="info"
          />
          <MetricCard
            label="Avisos"
            value={String(data.alerts.length)}
            detail={data.alerts.length ? "pedem sua atenção" : "nada urgente"}
            icon={Bell}
            tone="warning"
          />
        </section>
        <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card">
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" />
                Seus objetivos
              </CardTitle>
              <CardDescription>
                Pequenos passos viram grandes conquistas.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 sm:p-5">
              {goalOpen && (
                <GoalForm
                  spaceId={spaceId}
                  pending={pending}
                  onSubmit={(form) =>
                    run(
                      () => createGoal(form),
                      () => setGoalOpen(false),
                    )
                  }
                  onClose={() => setGoalOpen(false)}
                />
              )}
              {data.goals.length
                ? data.goals.map((goal) => {
                    const percentage = Math.min(
                      100,
                      Math.round(
                        (goal.currentCents / Math.max(goal.targetCents, 1)) *
                          100,
                      ),
                    );
                    return (
                      <div
                        key={goal.id}
                        className="rounded-2xl border border-border bg-card p-4"
                      >
                        {editingGoal === goal.id ? (
                          <GoalForm
                            spaceId={spaceId}
                            goal={goal}
                            pending={pending}
                            onSubmit={(form) =>
                              run(
                                () => updateGoal(goal.id, form),
                                () => setEditingGoal(null),
                              )
                            }
                            onClose={() => setEditingGoal(null)}
                          />
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{goal.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {goal.dueDate
                                    ? `Prazo em ${goal.dueDate}`
                                    : "Sem prazo definido"}
                                </p>
                              </div>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                {percentage}%
                              </span>
                            </div>
                            <Progress value={percentage} className="mt-4" />
                            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                              <span>
                                {formatBRL(goal.currentCents)} guardados
                              </span>
                              <strong className="text-foreground">
                                de {formatBRL(goal.targetCents)}
                              </strong>
                            </div>
                            <div className="mt-3 flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setGoalOpen(false);
                                  setEditingGoal(goal.id);
                                }}
                              >
                                <Settings2 data-icon />
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-status-danger"
                                onClick={() =>
                                  run(() => deleteGoal(goal.id, spaceId))
                                }
                              >
                                <Trash2 data-icon />
                                Remover
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                : !goalOpen && (
                    <EmptyState
                      icon={Target}
                      title="Ainda não há metas"
                      description="Comece com uma reserva de emergência ou uma viagem."
                      action="Criar primeira meta"
                      onClick={() => setGoalOpen(true)}
                    />
                  )}
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/25">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" />
                Limites do mês
              </CardTitle>
              <CardDescription>Tenha clareza antes de gastar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 sm:p-5">
              {budgetOpen && (
                <BudgetForm
                  spaceId={spaceId}
                  categories={data.categories}
                  pending={pending}
                  onSubmit={(form) =>
                    run(
                      () => createBudget(form),
                      () => setBudgetOpen(false),
                    )
                  }
                  onClose={() => setBudgetOpen(false)}
                />
              )}
              {data.budgets.length
                ? data.budgets.map((budget) =>
                    editingBudget === budget.id ? (
                      <BudgetForm
                        key={budget.id}
                        spaceId={spaceId}
                        categories={data.categories}
                        budget={budget}
                        pending={pending}
                        onSubmit={(form) =>
                          run(
                            () => updateBudget(budget.id, form),
                            () => setEditingBudget(null),
                          )
                        }
                        onClose={() => setEditingBudget(null)}
                      />
                    ) : (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {budget.categoryName ?? "Categoria"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Limite de {budget.month.slice(0, 7)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <strong className="text-sm">
                            {formatBRL(budget.limitCents)}
                          </strong>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar orçamento de ${budget.categoryName ?? "categoria"}`}
                            onClick={() => {
                              setBudgetOpen(false);
                              setEditingBudget(budget.id);
                            }}
                          >
                            <Settings2 />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-status-danger"
                            aria-label={`Remover orçamento de ${budget.categoryName ?? "categoria"}`}
                            onClick={() =>
                              run(() => deleteBudget(budget.id, spaceId))
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ),
                  )
                : !budgetOpen && (
                    <EmptyState
                      icon={BarChart3}
                      title="Nenhum limite definido"
                      description="Defina um valor mensal para acompanhar seus gastos."
                      action="Criar primeiro limite"
                      onClick={() => setBudgetOpen(true)}
                    />
                  )}
            </CardContent>
          </Card>
        </div>
        <Card id="planning-alerts" className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Alertas importantes
            </CardTitle>
            <CardDescription>O que merece sua atenção agora.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.alerts.length ? (
              data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-status-warning/25 bg-status-warning/5 p-4"
                >
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.body}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-status-success/20 bg-status-success/5 p-4 text-sm">
                <CircleCheck className="text-status-success" />
                Tudo em dia por enquanto.
              </div>
            )}
          </CardContent>
        </Card>
        <details className="group mt-5 rounded-2xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold marker:hidden">
            <span>Automatizar lançamentos</span>
            <span className="text-xs font-normal text-muted-foreground transition-transform group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="border-t border-border p-1 sm:p-3">
            <ScheduledOperations
              accounts={data.accounts}
              categories={data.categories}
              recurrences={data.recurrences}
              spaceId={spaceId}
            />
          </div>
        </details>
      </div>
    </main>
  );
}

function ActionCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  onClick,
  tone = "default",
}: {
  icon: typeof Target;
  eyebrow: string;
  title: string;
  description: string;
  onClick: () => void;
  tone?: "default" | "warning";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${tone === "warning" ? "border-status-warning/25 bg-status-warning/5" : "border-border bg-card hover:border-primary/40"}`}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary transition-transform group-hover:scale-105">
        <Icon />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </p>
      <p className="mt-1 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">
        {description}
      </p>
    </button>
  );
}
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: typeof Target;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/20 p-7 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {description}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={onClick}
      >
        <Plus data-icon />
        {action}
      </Button>
    </div>
  );
}
function GoalForm({
  spaceId,
  goal,
  pending,
  onSubmit,
  onClose,
}: {
  spaceId: string;
  goal?: Data["goals"][number];
  pending: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
}) {
  return (
    <form
      className="grid gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        form.set("spaceId", spaceId);
        onSubmit(form);
      }}
    >
      <div>
        <p className="text-sm font-semibold">
          {goal ? "Editar objetivo" : "Novo objetivo"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Defina um nome, um valor e, se quiser, um prazo.
        </p>
      </div>
      <label className="grid gap-1.5">
        <Label>Nome</Label>
        <Input
          name="name"
          defaultValue={goal?.name ?? ""}
          placeholder="Ex.: Reserva de emergência"
          required
          className="h-11 rounded-xl bg-card"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1.5">
          <Label>Valor-alvo (R$)</Label>
          <CurrencyInput
            name="target"
            defaultValue={
              goal ? (goal.targetCents / 100).toFixed(2) : undefined
            }
            required
            className="h-11 rounded-xl bg-card"
          />
        </label>
        <label className="grid gap-1.5">
          <Label>Já guardado</Label>
          <CurrencyInput
            name="current"
            defaultValue={goal ? (goal.currentCents / 100).toFixed(2) : "0"}
            required
            className="h-11 rounded-xl bg-card"
          />
        </label>
      </div>
      <label className="grid gap-1.5">
        <Label>Prazo (opcional)</Label>
        <Input
          name="dueDate"
          type="date"
          defaultValue={goal?.dueDate ?? ""}
          className="h-11 rounded-xl bg-card"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" loading={pending} className="flex-1">
          {pending ? "Salvando..." : goal ? "Atualizar" : "Salvar objetivo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
function BudgetForm({
  spaceId,
  categories,
  budget,
  pending,
  onSubmit,
  onClose,
}: {
  spaceId: string;
  categories: { id: string; name: string }[];
  budget?: Data["budgets"][number];
  pending: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = useState(
    budget?.categoryId ?? categories[0]?.id ?? "",
  );
  return (
    <form
      className="grid gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        form.set("spaceId", spaceId);
        form.set("categoryId", categoryId);
        onSubmit(form);
      }}
    >
      <div>
        <p className="text-sm font-semibold">
          {budget ? "Editar limite" : "Novo limite"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Escolha uma categoria e um valor mensal confortável.
        </p>
      </div>
      <label className="grid gap-1.5">
        <Label>Categoria</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => value && setCategoryId(value)}
        >
          <SelectTrigger className="h-11 rounded-xl bg-card">
            <SelectValue>
              {categories.find((item) => item.id === categoryId)?.name ??
                "Selecione a categoria"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-1.5">
        <Label>Mês</Label>
        <Input
          name="month"
          type="month"
          defaultValue={budget?.month.slice(0, 7)}
          required
          className="h-11 rounded-xl bg-card"
        />
      </label>
      <label className="grid gap-1.5">
        <Label>Limite mensal (R$)</Label>
        <CurrencyInput
          name="limit"
          defaultValue={
            budget ? (budget.limitCents / 100).toFixed(2) : undefined
          }
          required
          className="h-11 rounded-xl bg-card"
        />
      </label>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending || !categoryId}
          className="flex-1"
        >
          {pending ? "Salvando..." : budget ? "Atualizar" : "Salvar limite"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
