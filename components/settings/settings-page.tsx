"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Plus, Settings2, Trash2, WalletCards } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createIncomeProfile, deleteIncomeProfile, markIncomeReceived, updateIncomeProfile } from "@/server/actions/income-profiles";
import { formatBRL } from "@/lib/utils";
import { DeleteAccountSection, InviteAccountSection, ProfileSettings } from "@/components/settings/profile-settings";
import { MemberManagement } from "@/components/settings/member-management";
import { ThemeSelector } from "@/components/theme/theme-selector";

type IncomeProfile = { id: string; name: string; kind: string; amountCents: number; paymentDay: number; lastReceivedMonth?: string | null; financialSpaceId?: string; readOnly?: boolean; ownerName: string; accountName: string; ownerUserId?: string; accountId?: string };
type Member = { id: string; userId: string; name: string; role: string; status: string; permissions: Record<string, boolean> };
type Account = { id: string; name: string };
type Capabilities = { canManageMembers: boolean; canManageIncomeProfiles: boolean; canDeleteAccount: boolean };
type Data = { spaceId: string; members: Member[]; accounts: Account[]; profiles: IncomeProfile[]; profile: { name: string; email: string; image: string | null }; capabilities: Capabilities };

const labels = { salary: "Salário", va: "Vale alimentação (VA)", vr: "Vale refeição (VR)", benefit: "Outro benefício" };
const tabs = [
  ["profile", "Perfil"],
  ["invite", "Convites"],
  ["members", "Membros"],
  ["income", "Rendas"],
  ["danger", "Exclusão"],
] as const;
type SettingsTab = (typeof tabs)[number][0];

export function SettingsPage({ data, initialTab = "profile" }: { data: Data; initialTab?: SettingsTab }) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  return (
    <main className="min-h-screen bg-background lg:pl-64">
      <div className="mx-auto max-w-[1200px] px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-24">
        <header className="border-b border-border pb-7">
          <p className="text-sm text-muted-foreground">Preferências do espaço</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Configurações</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Gerencie perfil, convites, membros, permissões e rendas do espaço ativo.</p>
        </header>

        <Tabs value={tab} onValueChange={(value) => typeof value === "string" && setTab(value as (typeof tabs)[number][0])} className="mt-6 gap-5">
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto rounded-xl bg-muted p-1">
            {tabs.map(([value, label]) => <TabsTrigger key={value} value={value} className="min-h-10 px-4">{label}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-5">
              <ProfileSettings spaceId={data.spaceId} profile={data.profile} />
              <ThemeSelector />
            </div>
          </TabsContent>
          <TabsContent value="invite">
            <InviteAccountSection spaceId={data.spaceId} canInvite={data.capabilities.canManageMembers} />
          </TabsContent>
          <TabsContent value="members">
            <MemberManagement spaceId={data.spaceId} members={data.members} canManageMembers={data.capabilities.canManageMembers} onAddMember={() => setTab("invite")} />
          </TabsContent>
          <TabsContent value="income">
            <IncomeSettings data={data} />
          </TabsContent>
          <TabsContent value="danger">
            <DeleteAccountSection spaceId={data.spaceId} canDelete={data.capabilities.canDeleteAccount} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function IncomeSettings({ data }: { data: Data }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<IncomeProfile | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const canManage = data.capabilities.canManageIncomeProfiles;
  const canSubmit = canManage && data.members.some((member) => member.status === "active") && data.accounts.length > 0;

  function openForm(profile?: IncomeProfile) {
    setEditing(profile ?? null);
    setOpen(true);
  }

  function submit(formData: FormData) {
    formData.set("spaceId", data.spaceId);
    startTransition(async () => {
      const result = editing ? await updateIncomeProfile(editing.id, formData) : await createIncomeProfile(formData);
      setMessage(result.message ?? "");
      if (result.success) {
        toast.success(result.message ?? "Renda salva.");
        setOpen(false);
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.message ?? "Não foi possível salvar a renda.");
      }
    });
  }

  function remove(profile: IncomeProfile) {
    startTransition(async () => {
      const result = await deleteIncomeProfile(profile.id, data.spaceId);
      setMessage(result.message ?? "");
      if (result.success) {
        toast.success(result.message ?? "Renda removida.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Não foi possível remover a renda.");
      }
    });
  }

  function receive(profile: IncomeProfile) {
    startTransition(async () => {
      const result = await markIncomeReceived(profile.id, data.spaceId);
      setMessage(result.message ?? "");
      if (result.success) { toast.success(result.message ?? "Recebimento registrado."); router.refresh(); }
      else toast.error(result.message ?? "Não foi possível registrar o recebimento.");
    });
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]" aria-label="Rendas e benefícios">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><WalletCards />Rendas e benefícios</CardTitle>
            <CardDescription>Salário, VA, VR e outros benefícios vinculados a pessoas e contas.</CardDescription>
          </div>
          <Button type="button" onClick={() => openForm()} disabled={!canSubmit}><Plus data-icon="inline-start" />Adicionar renda</Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.profiles.length ? <div className="grid gap-3 sm:grid-cols-2">{data.profiles.map((profile) => { const canManageProfile = canManage && !profile.readOnly; return <article key={profile.id} className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-primary/5 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><div className="absolute inset-x-0 top-0 h-1 bg-primary" /><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><WalletCards className="size-5" /></span><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{labels[profile.kind as keyof typeof labels]}</span></div><p className="mt-5 truncate font-semibold">{profile.name}</p><p className="mt-1 text-xs text-muted-foreground">{profile.ownerName} · {profile.accountName}</p>{profile.readOnly && <p className="mt-2 text-xs text-primary">Renda compartilhada do espaço conjunto</p>}<div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-xs text-muted-foreground">Saldo da recarga</p><p className="mt-1 text-2xl font-semibold tracking-tight">{formatBRL(profile.amountCents)}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Próxima recarga</p><p className="mt-1 text-sm font-semibold">Dia {profile.paymentDay}</p></div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3"><Button type="button" size="sm" className="flex-1" disabled={!canManageProfile || pending || !profile.accountId} onClick={() => receive(profile)}><Check data-icon="inline-start" />{pending ? "Registrando..." : "Marcar como recebido"}</Button><Button variant="ghost" size="icon" aria-label={`Editar ${profile.name}`} disabled={!canSubmit || pending || !canManageProfile} onClick={() => openForm(profile)}><Settings2 /></Button><IncomeDeleteButton profile={profile} pending={pending || !canManageProfile} onConfirm={() => remove(profile)} /></div></article>; })}</div> : (
            <Empty className="border border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><WalletCards /></EmptyMedia>
                <EmptyTitle>Nenhuma renda cadastrada</EmptyTitle>
                <EmptyDescription>Adicione salário, VA, VR ou benefício para este espaço.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button type="button" onClick={() => openForm()} disabled={!canSubmit}>Adicionar renda</Button></EmptyContent>
            </Empty>
          )}
          {!canManage && <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">Você pode consultar rendas, mas não tem permissão para alterá-las neste espaço.</p>}
          {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus />Nova renda</CardTitle>
          <CardDescription>Use o formulário para adicionar ou editar a renda selecionada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-xl border border-border bg-muted p-4">
            <p className="text-sm font-medium">{editing ? "Editando renda existente" : "Pronto para cadastrar"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{canSubmit ? "O lançamento futuro usará a conta escolhida como destino." : "É preciso ter membro ativo, conta não arquivada e permissão de planejamento."}</p>
          </div>
          <Button type="button" onClick={() => openForm(editing ?? undefined)} disabled={!canSubmit}>{editing ? "Continuar edição" : "Adicionar renda"}</Button>
          <Separator />
          <p className="text-xs leading-5 text-muted-foreground">Remover renda é feito pela lista para manter contexto de pessoa, tipo e conta de recebimento.</p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar renda" : "Nova renda"}</DialogTitle>
            <DialogDescription>Defina pessoa responsável, tipo, valor mensal, dia de recebimento e conta destino.</DialogDescription>
          </DialogHeader>
          <IncomeForm key={editing?.id ?? "new"} profile={editing} members={data.members} accounts={data.accounts} onSubmit={submit} pending={pending} />
        </DialogContent>
      </Dialog>
    </section>
  );
}

function IncomeDeleteButton({ profile, pending, onConfirm }: { profile: IncomeProfile; pending: boolean; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon" className="text-status-danger" aria-label={`Remover ${profile.name}`} disabled={pending} />}>
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover renda</AlertDialogTitle>
          <AlertDialogDescription>Remover {profile.name} não apaga lançamentos financeiros já existentes.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="button" className="border border-status-danger bg-transparent text-status-danger hover:bg-status-danger/10" disabled={pending} onClick={onConfirm}>Remover renda</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IncomeForm({ profile, members, accounts, onSubmit, pending }: { profile: IncomeProfile | null; members: Member[]; accounts: Account[]; onSubmit: (form: FormData) => void; pending: boolean }) {
  const activeMembers = members.filter((member) => member.status === "active");
  const [kind, setKind] = useState(profile?.kind ?? "salary");
  const [ownerUserId, setOwnerUserId] = useState(profile?.ownerUserId ?? activeMembers[0]?.userId ?? "");
  const [accountId, setAccountId] = useState(profile?.accountId ?? accounts[0]?.id ?? "");

  return (
    <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); form.set("kind", kind); form.set("ownerUserId", ownerUserId); form.set("accountId", accountId); onSubmit(form); }}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="income-name">Nome</FieldLabel>
          <Input id="income-name" name="name" defaultValue={profile?.name ?? ""} placeholder="Ex.: Salário do Diego" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Pessoa</FieldLabel>
            <Select value={ownerUserId} onValueChange={(value) => value && setOwnerUserId(value)} disabled={pending || activeMembers.length === 0}>
              <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue>{activeMembers.find((member) => member.userId === ownerUserId)?.name ?? "Selecione a pessoa"}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectGroup>{activeMembers.map((member) => <SelectItem key={member.userId} value={member.userId}>{member.name}</SelectItem>)}</SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Select value={kind} onValueChange={(value) => value && setKind(value)} disabled={pending}>
              <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue>{labels[kind as keyof typeof labels] ?? "Salário"}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectGroup>{Object.entries(labels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel>Conta de recebimento</FieldLabel>
          <Select value={accountId} onValueChange={(value) => value && setAccountId(value)} disabled={pending || accounts.length === 0}>
            <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue>{accounts.find((account) => account.id === accountId)?.name ?? "Selecione a conta"}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectGroup>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>A conta precisa pertencer ao espaço ativo.</FieldDescription>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="income-amount">Valor mensal (R$)</FieldLabel>
            <CurrencyInput id="income-amount" name="amount" defaultValue={profile ? (profile.amountCents / 100).toFixed(2) : undefined} placeholder="0,00" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="income-payment-day">Dia de recebimento</FieldLabel>
            <Input id="income-payment-day" name="paymentDay" type="number" min="1" max="31" defaultValue={profile?.paymentDay ?? undefined} placeholder="5" required />
          </Field>
        </div>
      </FieldGroup>
      <DialogFooter>
        <Button type="submit" disabled={pending || !ownerUserId || !accountId}>{pending ? "Salvando..." : profile ? "Atualizar renda" : "Cadastrar renda"}</Button>
      </DialogFooter>
    </form>
  );
}
