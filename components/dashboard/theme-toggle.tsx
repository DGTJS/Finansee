"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { Moon, Sun } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const dark = mode === "dark";
  function toggle() { setMode(dark ? "light" : "dark"); }
  return <Button type="button" variant="ghost" size="icon" className="size-10 rounded-xl text-muted-foreground hover:text-foreground" onClick={toggle} aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}>{dark ? <Sun /> : <Moon />}</Button>;
}
