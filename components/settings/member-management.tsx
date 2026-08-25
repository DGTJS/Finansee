"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Settings2, Trash2, Users } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { updateMemberAccess } from "@/server/actions/profile";

type Member = { id: string; userId: string; name: string; role: string; status: string; permissions: Record<string, boolean> };
type PermissionState = { transactions: boolean; accounts: boolean; planning: boolean };

const roleLabels: Record<string, string> = { owner: "Proprietário", admin: "Administrador", member: "Membro", viewer: "Visualizador" };
const statusLabels: Record<string, string> = { active: "Ativo", removed: "Removido" };

function permissionsOf(member: Member): PermissionState {
  return { transactions: member.permissions["transactions:write"] ?? member.role !== "viewer", accounts: member.permissions["accounts:write"] ?? false, planning: member.permissions["planning:write"] ?? member.role !== "viewer" };
}

function buildMemberForm(spaceId: string, member: Member, role: string, status: string, permissions: PermissionState) {
  const form = new FormData();
  form.set("spaceId", spaceId);
  form.set("memberId", member.id);
  form.set("role", role);
  form.set("status", status);
  form.set("transactions", String(permissions.transactions));
  form.set("accounts", String(permissions.accounts));
  form.set("planning", String(permissions.planning));
  return form;
}

export function MemberManagement({ spaceId, members, canManageMembers, onAddMember }: { spaceId: string; members: Member[]; canManageMembers: boolean; onAddMember: () => void }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);

  function save(member: Member, role: string, status: string, permissions: PermissionState, afterSave?: () => void) {
    startTransition(async () => {
      const result = await updateMemberAccess(buildMemberForm(spaceId, member, role, status, permissions));
      setMessage(result.message ?? "");
      if (result.success) {
        toast.success(result.message ?? "Membro atualizado.");
        afterSave?.();
      } else {
        toast.error(result.message ?? "Não foi possível atualizar o membro.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Users />Membros e permissões</CardTitle>
          <CardDescription>Controle papel, status e módulos autorizados de cada pessoa.</CardDescription>
        </div>
        <Button type="button" onClick={onAddMember} disabled={!canManageMembers}>Adicionar membro</Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {members.map((member) => {
          const protectedOwner = member.role === "owner";
          const currentPermissions = permissionsOf(member);
          return (
            <div key={member.id} className="flex flex-col gap-4 rounded-xl border border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="secondary">{roleLabels[member.role] ?? member.role}</Badge>
                    <Badge variant={member.status === "active" ? "default" : "outline"}>{statusLabels[member.status] ?? member.status}</Badge>
                  </div>
                </div>
                {protectedOwner ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary"><Check />Protegido</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={!canManageMembers || pending} onClick={() => setEditing(member)}><Settings2 data-icon="inline-start" />Editar membro</Button>
                    <MemberStatusDialog member={member} pending={pending || !canManageMembers} onConfirm={() => save(member, member.role, member.status === "active" ? "removed" : "active", currentPermissions)} />
                  </div>
                )}
              </div>
              {!protectedOwner && (
                <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-3">
                  <PermissionPill enabled={currentPermissions.transactions} label="Lançamentos" />
                  <PermissionPill enabled={currentPermissions.accounts} label="Contas" />
                  <PermissionPill enabled={currentPermissions.planning} label="Planejamento" />
                </div>
              )}
            </div>
          );
        })}
        {!canManageMembers && <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">Você pode consultar membros, mas não tem permissão para alterar acessos neste espaço.</p>}
        {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
      </CardContent>
      {editing && <EditMemberDialog key={editing.id} member={editing} open={Boolean(editing)} pending={pending} onOpenChange={(open) => !open && setEditing(null)} onSave={(member, role, status, permissions) => save(member, role, status, permissions, () => setEditing(null))} />}
    </Card>
  );
}

function PermissionPill({ enabled, label }: { enabled: boolean; label: string }) {
  return <span className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-border px-3 text-sm"><span>{label}</span><Badge variant={enabled ? "secondary" : "outline"}>{enabled ? "Liberado" : "Bloqueado"}</Badge></span>;
}

function MemberStatusDialog({ member, pending, onConfirm }: { member: Member; pending: boolean; onConfirm: () => void }) {
  const removing = member.status === "active";
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="outline" size="sm" className={removing ? "border-status-danger text-status-danger hover:bg-status-danger/10" : ""} disabled={pending} />}>
        {removing ? <Trash2 data-icon="inline-start" /> : <Check data-icon="inline-start" />}{removing ? "Remover membro" : "Reativar membro"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{removing ? "Remover acesso" : "Reativar acesso"}</AlertDialogTitle>
          <AlertDialogDescription>{removing ? `Remover ${member.name} bloqueia o acesso imediatamente, sem apagar o histórico financeiro.` : `Reativar ${member.name} devolve o acesso ao espaço com as permissões atuais.`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="button" className={removing ? "border border-status-danger bg-transparent text-status-danger hover:bg-status-danger/10" : ""} disabled={pending} onClick={onConfirm}>{removing ? "Remover acesso" : "Reativar"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditMemberDialog({ member, open, pending, onOpenChange, onSave }: { member: Member; open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onSave: (member: Member, role: string, status: string, permissions: PermissionState) => void }) {
  const [role, setRole] = useState(member.role === "owner" ? "admin" : member.role);
  const [status, setStatus] = useState(member.status);
  const [permissions, setPermissions] = useState<PermissionState>(() => permissionsOf(member));

  return (
    <Dialog open={open} onOpenChange={(value) => onOpenChange(value)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar membro</DialogTitle>
          <DialogDescription>Atualize o papel, status e permissões de {member.name}.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Papel</FieldLabel>
              <Select value={role} onValueChange={(value) => value && setRole(value)}>
                <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue>{roleLabels[role] ?? role}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={(value) => value && setStatus(value)}>
                <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue>{statusLabels[status] ?? status}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="removed">Removido</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field orientation="horizontal">
            <Switch checked={permissions.transactions} onCheckedChange={(checked) => setPermissions((current) => ({ ...current, transactions: checked }))} disabled={pending || status !== "active"} />
            <FieldContent><FieldTitle>Lançamentos</FieldTitle><FieldDescription>Criar e alterar receitas ou despesas.</FieldDescription></FieldContent>
          </Field>
          <Field orientation="horizontal">
            <Switch checked={permissions.accounts} onCheckedChange={(checked) => setPermissions((current) => ({ ...current, accounts: checked }))} disabled={pending || status !== "active"} />
            <FieldContent><FieldTitle>Contas</FieldTitle><FieldDescription>Gerenciar contas e permissões administrativas.</FieldDescription></FieldContent>
          </Field>
          <Field orientation="horizontal">
            <Switch checked={permissions.planning} onCheckedChange={(checked) => setPermissions((current) => ({ ...current, planning: checked }))} disabled={pending || status !== "active"} />
            <FieldContent><FieldTitle>Planejamento</FieldTitle><FieldDescription>Gerenciar metas, orçamentos, investimentos e rendas.</FieldDescription></FieldContent>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
          <Button type="button" onClick={() => onSave(member, role, status, permissions)} disabled={pending}>{pending ? "Salvando..." : "Salvar membro"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
