"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Trash2, UserRound, Users } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { requestPasswordReset } from "@/server/actions/auth";
import { changePassword, createInvitation, createParticipantAccount, deleteAccount, updateProfile } from "@/server/actions/profile";

type Profile = { name: string; email: string; image: string | null };
type ActionResult = { success: boolean; message?: string; data?: { inviteUrl?: string }; developmentLink?: string };

function notify(result: ActionResult) {
  if (result.success) toast.success(result.message ?? "Alteração salva.");
  else toast.error(result.message ?? "Não foi possível concluir.");
}

export function ProfileSettings({ spaceId, profile }: { spaceId: string; profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [recoveryLink, setRecoveryLink] = useState("");
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "F";

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.message ?? "");
      setRecoveryLink(result.developmentLink ?? "");
      notify(result);
    });
  }

  return (
    <section className="grid gap-5" aria-label="Configurar perfil">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound />Configurar perfil</CardTitle>
          <CardDescription>Atualize foto, nome e e-mail usados no espaço financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]" encType="multipart/form-data" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); form.set("spaceId", spaceId); run(() => updateProfile(form)); }}>
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              {profile.image ? <Image src={profile.image} alt="" width={72} height={72} unoptimized className="size-18 rounded-2xl object-cover" /> : <span className="grid size-18 place-items-center rounded-2xl bg-sidebar font-display text-xl font-bold text-sidebar-foreground">{initials}</span>}
              <p className="max-w-44 text-xs leading-5 text-muted-foreground">JPG, PNG ou WebP, até 500 KB.</p>
            </div>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
                  <Input id="profile-name" name="name" defaultValue={profile.name} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
                  <Input id="profile-email" name="email" type="email" defaultValue={profile.email} required />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="profile-image-file">Foto do avatar</FieldLabel>
                <Input id="profile-image-file" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" className="h-auto min-h-11 cursor-pointer py-2" />
                <FieldDescription>A foto aparece na navbar, cartões e detalhes de transações.</FieldDescription>
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar perfil"}</Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound />Senha</CardTitle>
            <CardDescription>Altere sua senha usando a senha atual.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); run(() => changePassword(new FormData(event.currentTarget))); }}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="current-password">Senha atual</FieldLabel>
                  <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                  <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
                  <FieldDescription>Use pelo menos oito caracteres.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password-confirmation">Confirmar nova senha</FieldLabel>
                  <Input id="password-confirmation" name="confirmation" type="password" autoComplete="new-password" required />
                </Field>
              </FieldGroup>
              <Button type="submit" variant="outline" disabled={pending}>Atualizar senha</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound />Recuperação de senha</CardTitle>
            <CardDescription>Envie um link seguro para redefinir a senha da conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); run(() => requestPasswordReset(new FormData(event.currentTarget))); }}>
              <Field>
                <FieldLabel htmlFor="recovery-email">E-mail da conta</FieldLabel>
                <Input id="recovery-email" name="email" type="email" defaultValue={profile.email} required />
              </Field>
              <Button type="submit" variant="outline" disabled={pending}>Enviar recuperação</Button>
              {recoveryLink && <a href={recoveryLink} className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm font-medium text-primary">Abrir link de recuperação local</a>}
            </form>
          </CardContent>
        </Card>
      </div>

      {message && <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm" role="status">{message}</p>}
    </section>
  );
}

export function InviteAccountSection({ spaceId, canInvite }: { spaceId: string; canInvite: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [role, setRole] = useState("member");
  const [participantMessage, setParticipantMessage] = useState("");

  function submit(formData: FormData) {
    formData.set("spaceId", spaceId);
    formData.set("role", role);
    startTransition(async () => {
      const result = await createInvitation(formData);
      setMessage(result.message ?? "");
      setInviteUrl(result.data?.inviteUrl ?? "");
      notify(result);
    });
  }

  function createParticipant(formData: FormData) {
    formData.set("spaceId", spaceId);
    startTransition(async () => {
      const result = await createParticipantAccount(formData);
      setParticipantMessage(result.message ?? "");
      notify(result);
      if (result.success) (document.getElementById("participant-account-form") as HTMLFormElement | null)?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users />Convidar conta</CardTitle>
        <CardDescription>Crie um convite pessoal, protegido por token e válido por sete dias.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget)); }}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <Field data-disabled={!canInvite}>
              <FieldLabel htmlFor="invite-email">E-mail da pessoa</FieldLabel>
              <Input id="invite-email" name="email" type="email" placeholder="pessoa@exemplo.com" disabled={!canInvite || pending} required />
            </Field>
            <Field data-disabled={!canInvite}>
              <FieldLabel>Permissão inicial</FieldLabel>
              <Select value={role} onValueChange={(value) => value && setRole(value)} disabled={!canInvite || pending}>
                <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue>{role === "viewer" ? "Somente leitura" : "Participante"}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="member">Participante</SelectItem>
                    <SelectItem value="viewer">Somente leitura</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={!canInvite || pending}>{pending ? "Criando..." : "Convidar"}</Button>
            {!canInvite && <span className="text-sm text-muted-foreground">Você não tem permissão para convidar membros.</span>}
          </div>
          {inviteUrl && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted p-3 sm:flex-row">
              <Input readOnly value={inviteUrl} aria-label="Link do convite" />
              <Button type="button" size="icon" variant="ghost" aria-label="Copiar link do convite" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Link copiado."); }}><Copy /></Button>
            </div>
          )}
          {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
          <div className="grid gap-4 border-t border-border pt-5">
            <div>
              <p className="font-medium">Criar participante diretamente</p>
              <p className="mt-1 text-sm text-muted-foreground">Cadastre a pessoa agora e ela poderá entrar com estas credenciais.</p>
            </div>
            <form id="participant-account-form" className="grid gap-4" onSubmit={(event) => { event.preventDefault(); createParticipant(new FormData(event.currentTarget)); }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-disabled={!canInvite}><FieldLabel htmlFor="participant-name">Nome completo</FieldLabel><Input id="participant-name" name="name" autoComplete="name" placeholder="Nome da pessoa" disabled={!canInvite || pending} minLength={2} required /></Field>
                <Field data-disabled={!canInvite}><FieldLabel htmlFor="participant-email">E-mail</FieldLabel><Input id="participant-email" name="email" type="email" autoComplete="email" placeholder="pessoa@exemplo.com" disabled={!canInvite || pending} required /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-disabled={!canInvite}><FieldLabel htmlFor="participant-password">Senha provisória</FieldLabel><Input id="participant-password" name="password" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" disabled={!canInvite || pending} minLength={8} required /></Field>
                <Field data-disabled={!canInvite}><FieldLabel htmlFor="participant-confirmation">Confirmar senha</FieldLabel><Input id="participant-confirmation" name="confirmation" type="password" autoComplete="new-password" placeholder="Repita a senha" disabled={!canInvite || pending} minLength={8} required /></Field>
              </div>
              <Button type="submit" className="w-fit" disabled={!canInvite || pending}>{pending ? "Criando participante..." : "Criar participante"}</Button>
              {participantMessage && <p className="text-sm text-muted-foreground" role="status">{participantMessage}</p>}
            </form>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteAccountSection({ spaceId, canDelete }: { spaceId: string; canDelete: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  function submit(formData: FormData) {
    formData.set("spaceId", spaceId);
    startTransition(async () => {
      const result = await deleteAccount(formData);
      setMessage(result.message ?? "");
      notify(result);
      if (result.success) setOpen(false);
    });
  }

  return (
    <Card className="border-status-danger/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-status-danger"><Trash2 />Excluir conta</CardTitle>
        <CardDescription>Esta ação remove seu usuário e os espaços dos quais você é proprietário.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <AlertDialog open={open} onOpenChange={(value) => setOpen(value)}>
          <AlertDialogTrigger render={<Button type="button" variant="outline" className="w-fit border-status-danger text-status-danger hover:bg-status-danger/10" disabled={!canDelete} />}>Excluir conta</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conta permanentemente</AlertDialogTitle>
              <AlertDialogDescription>Confirme sua senha e digite EXCLUIR. Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget)); }}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="delete-current-password">Senha atual</FieldLabel>
                  <Input id="delete-current-password" name="currentPassword" type="password" autoComplete="current-password" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="delete-confirmation">Digite EXCLUIR para confirmar</FieldLabel>
                  <Input id="delete-confirmation" name="confirmation" autoComplete="off" required />
                </Field>
              </FieldGroup>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction type="submit" className="border border-status-danger bg-transparent text-status-danger hover:bg-status-danger/10" disabled={pending}>{pending ? "Excluindo..." : "Excluir permanentemente"}</AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
        {!canDelete && <p className="text-sm text-muted-foreground">A exclusão protegida fica disponível apenas para usuários autenticados fora do modo demonstração.</p>}
        {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
      </CardContent>
    </Card>
  );
}
