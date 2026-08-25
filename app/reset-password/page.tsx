"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, KeyRound } from "@/components/icons";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (newPassword.length < 8 || newPassword !== confirmation) { setMessage(newPassword.length < 8 ? "A senha deve ter pelo menos oito caracteres." : "As senhas não conferem."); return; }
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ newPassword, token: params.get("token") }) });
    if (!response.ok) { setMessage("O link expirou ou não é válido."); return; }
    router.push("/login?reset=success");
  }

  return <main className="grid min-h-screen place-items-center bg-sidebar px-5 py-10 text-sidebar-foreground"><div className="w-full max-w-md"><Link href="/login" className="mx-auto flex w-fit items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black">F</span><span className="font-display text-2xl font-semibold">finansee<span className="text-primary">.</span></span></Link><div className="mt-10 rounded-3xl border border-sidebar-border bg-sidebar-accent p-7 shadow-2xl"><div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary"><KeyRound /></div><h1 className="mt-6 font-display text-2xl font-semibold">Criar nova senha</h1><p className="mt-2 text-sm text-sidebar-foreground/60">Escolha uma senha nova para voltar ao seu espaço.</p><form action={submit} className="mt-7 flex flex-col gap-4"><input name="newPassword" type="password" minLength={8} required placeholder="Nova senha" className="h-12 rounded-xl border border-sidebar-border bg-sidebar px-4 text-sm outline-none placeholder:text-sidebar-foreground/40 focus:border-primary" /><input name="confirmation" type="password" minLength={8} required placeholder="Confirme a nova senha" className="h-12 rounded-xl border border-sidebar-border bg-sidebar px-4 text-sm outline-none placeholder:text-sidebar-foreground/40 focus:border-primary" /><button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">Salvar nova senha<ArrowUpRight /></button></form>{message && <p className="mt-4 text-sm text-status-danger">{message}</p>}</div></div></main>;
}
