"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Check } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AvailableSpace } from "@/server/space";

export function SpaceSwitcher({ spaces }: { spaces: AvailableSpace[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const requested = searchParams.get("space");
  const value = spaces.some((space) => space.value === requested) ? requested! : spaces[0]?.value ?? "";
  const selected = spaces.find((space) => space.value === value) ?? spaces[0];

  function changeSpace(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "personal-space") params.delete("space");
    else params.set("space", next);
    const href = `${pathname}${params.size ? `?${params.toString()}` : ""}`;
    startTransition(() => {
      router.replace(href, { scroll: false });
      router.refresh();
    });
  }

  if (!selected) return null;
  return <Select value={value} onValueChange={(next) => next && changeSpace(next)} disabled={pending}>
    <SelectTrigger aria-label="Trocar conta ou espaço" className="h-auto min-h-[60px] w-full rounded-xl border-sidebar-border bg-sidebar-accent p-3 text-sidebar-foreground shadow-none">
      <SelectValue><SpaceSummary space={selected} /></SelectValue>
    </SelectTrigger>
    <SelectContent className="min-w-60 p-2">
      {spaces.map((space) => <SelectItem key={space.value} value={space.value} className="rounded-xl p-3"><SpaceSummary space={space} selected={space.value === value} /></SelectItem>)}
    </SelectContent>
  </Select>;
}

function SpaceSummary({ space, selected = false }: { space: AvailableSpace; selected?: boolean }) {
  return <span className="flex w-full min-w-0 items-center gap-3">
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-sidebar text-xs font-bold text-sidebar-foreground">{space.image ? <Image src={space.image} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : space.initials}</span>
    <span className="min-w-0 flex-1 flex-col gap-1 text-left"><strong className="block truncate text-sm">{space.name}</strong><small className="block truncate text-xs text-muted-foreground">{space.description}</small></span>
    {selected && <Check className="size-4 shrink-0 text-primary" />}
  </span>;
}
