"use client";

import { useState, useTransition } from "react";
import { Check, CircleHelp } from "@/components/icons";
import { acceptInvitation } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InvitationAcceptance({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function submit() { const form = new FormData(); form.set("token", token); startTransition(async () => setMessage((await acceptInvitation(form)).message ?? "")); }
  return <main className="grid min-h-screen place-items-center bg-background px-5 py-12"><Card className="w-full max-w-md"><CardHeader><CircleHelp className="size-6 text-primary" /><CardTitle>Convite para um espaço Finansee</CardTitle><CardDescription>O convite é pessoal e só pode ser aceito pelo e-mail que recebeu o link.</CardDescription></CardHeader><CardContent className="grid gap-4"><Button onClick={submit} disabled={pending}><Check data-icon />{pending ? "Validando..." : "Aceitar convite"}</Button>{message && <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm" role="status">{message}</p>}</CardContent></Card></main>;
}
