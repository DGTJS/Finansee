"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const THEME_STORAGE_KEY = "finansee-theme";
export const themeOptions = [
  { id: "default", label: "Lima", description: "Claro com verde lima", swatches: ["#f5f6f3", "#b8f34b"] },
  { id: "black-white", label: "Preto & branco", description: "Monocromático e preciso", swatches: ["#080808", "#f4f4f4"] },
  { id: "black-red", label: "Preto & vermelho", description: "Contraste forte e direto", swatches: ["#0b0b0c", "#ff5c69"] },
  { id: "white-black", label: "Branco & preto", description: "Claro, neutro e limpo", swatches: ["#fbfbfa", "#151515"] },
  { id: "black-green", label: "Preto & verde", description: "Escuro com verde profundo", swatches: ["#08110d", "#56d364"] },
  { id: "black-blue", label: "Preto & azul", description: "Escuro com azul elétrico", swatches: ["#080d17", "#5ba7ff"] },
] as const;
export type ThemeId = (typeof themeOptions)[number]["id"];
export type ThemeMode = "light" | "dark";
type ThemeContextValue = { theme: ThemeId; mode: ThemeMode; setTheme: (theme: ThemeId) => void; setMode: (mode: ThemeMode) => void; options: typeof themeOptions };
const ThemeContext = createContext<ThemeContextValue | null>(null);
function isThemeId(value: string | null): value is ThemeId { return themeOptions.some((option) => option.id === value); }
function defaultMode(theme: ThemeId): ThemeMode { return theme === "default" || theme === "white-black" ? "light" : "dark"; }
function applyTheme(theme: ThemeId, mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("default");
  const [mode, setModeState] = useState<ThemeMode>("light");
  // Theme preferences are read from browser storage after hydration.
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    try {
      const parsed = JSON.parse(saved ?? "null") as {
        theme?: string;
        mode?: ThemeMode;
      } | null;
      const next = isThemeId(parsed?.theme ?? null)
        ? (parsed!.theme as ThemeId)
        : saved === "dark"
          ? "default"
          : isThemeId(saved)
            ? saved
            : "default";
      const nextMode =
        parsed?.mode === "light" || parsed?.mode === "dark"
          ? parsed.mode
          : saved === "dark" || (next !== "default" && next !== "white-black")
            ? defaultMode(next)
            : "light";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(next);
      setModeState(nextMode);
      applyTheme(next, nextMode);
    } catch {
      setThemeState("default");
      setModeState("light");
      applyTheme("default", "light");
    }
  }, []);
  const persist = useCallback((nextTheme: ThemeId, nextMode: ThemeMode) => { setThemeState(nextTheme); setModeState(nextMode); localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ theme: nextTheme, mode: nextMode })); applyTheme(nextTheme, nextMode); }, []);
  const setTheme = useCallback((next: ThemeId) => persist(next, mode), [mode, persist]);
  const setMode = useCallback((next: ThemeMode) => persist(theme, next), [persist, theme]);
  const value = useMemo(() => ({ theme, mode, setTheme, setMode, options: themeOptions }), [mode, setMode, setTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider"); return context; }
