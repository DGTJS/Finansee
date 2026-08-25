"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AvailableSpace } from "@/server/space";

export function SpaceSwitcher({ spaces }: { spaces: AvailableSpace[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = spaces.some((space) => space.value === searchParams.get("space")) ? searchParams.get("space")! : spaces[0]?.value ?? "";
  const selected = spaces.find((space) => space.value === value) ?? spaces[0];

  function changeSpace(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "personal-space") params.delete("space");
    else params.set("space", next);
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  }

  if (!selected) return null;
  return <Select value={value} onValueChange={(next) => next && changeSpace(next)}><SelectTrigger className="h-auto min-h-[60px] w-full rounded-xl border-sidebar-border bg-sidebar-accent p-3 text-sidebar-foreground shadow-none"><SelectValue><span className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground text-xs font-bold text-background">{selected.image ? <Image src={selected.image} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : selected.initials}</span><span className="flex min-w-0 flex-1 flex-col items-start gap-1"><strong className="truncate text-sm text-sidebar-foreground">{selected.name}</strong><small className="text-xs text-sidebar-foreground/70">{selected.description}</small></span></span></SelectValue></SelectTrigger><SelectContent className="min-w-60 p-2">{spaces.map((space) => <SelectItem key={space.value} value={space.value} className="rounded-xl p-3"><span className="flex w-full items-center gap-3"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-sidebar text-xs font-bold text-sidebar-foreground">{space.image ? <Image src={space.image} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : space.initials}</span><span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="truncate">{space.name}</strong><small className="text-muted-foreground">{space.description}</small></span>{space.value === value && <Check className="size-4 text-primary" />}</span></SelectItem>)}</SelectContent></Select>;
}
