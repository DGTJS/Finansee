"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, Users, WalletCards } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AvailableSpace } from "@/server/space";
import { useRouter } from "next/navigation";
import { LogoutConfirmationDialog } from "@/components/dashboard/logout-confirmation-dialog";

export function ProfileMenu() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string; image: string | null; spaces?: AvailableSpace[] } | null>(null);
  useEffect(() => { fetch("/api/profile").then((response) => response.ok ? response.json() : null).then((data) => data && setProfile(data)).catch(() => undefined); }, []);
  const availableSpaces = profile?.spaces ?? [];
  const selected = availableSpaces.find((space) => space.value === searchParams.get("space")) ?? availableSpaces[0];
  const displayName = selected?.name ?? profile?.name ?? "Usuário Finansee";
  const firstName = displayName.split(" ")[0];
  const initials = selected?.initials || displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "F";
  const spaceQuery = searchParams.get("space");
  const withCurrentSpace = (path: string) => spaceQuery ? `${path}${path.includes("?") ? "&" : "?"}space=${encodeURIComponent(spaceQuery)}` : path;
  const image = selected?.image ?? profile?.image;
  async function logout() { setPending(true); try { const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); if (response.ok) { router.push("/login"); router.refresh(); } } finally { setPending(false); } }
  return <><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" className="h-11 gap-2 rounded-[30px] bg-card px-2.5 shadow-sm sm:px-2.5" aria-label={`Abrir perfil de ${firstName}`}>{image ? <Image src={image} alt="" width={32} height={32} unoptimized className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-sidebar text-xs font-bold text-sidebar-foreground">{initials}</span>}<span className="pr-1 text-sm font-semibold">{firstName}</span></Button>} /><DropdownMenuContent align="end" className="w-60"><DropdownMenuLabel><span className="block text-sm font-semibold">{displayName}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{selected?.description ?? "Conta financeira"}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem render={<Link href={withCurrentSpace("/settings?tab=profile")}><Eye data-icon />Configurar perfil</Link>} /><DropdownMenuItem render={<Link href={withCurrentSpace("/settings?tab=members")}><Users data-icon />Gerenciar espaço</Link>} /><DropdownMenuItem render={<Link href={withCurrentSpace("/accounts")}><WalletCards data-icon />Minhas contas</Link>} /></DropdownMenuContent></DropdownMenu><LogoutConfirmationDialog open={logoutOpen} pending={pending} onOpenChange={setLogoutOpen} onConfirm={logout} /></>;
}
