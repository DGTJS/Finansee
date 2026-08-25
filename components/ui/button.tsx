import * as React from "react";
import { cn } from "@/lib/utils";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

export function Button({ className, variant = "default", size = "default", loading = false, loadingLabel, children, disabled, "aria-label": ariaLabel, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "outline"; size?: "default" | "icon" | "sm"; loading?: boolean; loadingLabel?: string }) {
  const accessibleLabel = loadingLabel ?? ariaLabel ?? "Carregando";
  return <button className={cn("inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50", variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90", variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-foreground", variant === "outline" && "border border-border bg-card text-foreground hover:bg-accent", size === "icon" && "size-10", size === "sm" && "h-9 px-3 text-sm", size === "default" && "h-11 px-4", className)} disabled={disabled || loading} aria-busy={loading || undefined} aria-label={ariaLabel ?? (loading && size === "icon" ? accessibleLabel : undefined)} {...props}>{loading ? <><LoadingIndicator size="sm" label={accessibleLabel} />{size === "icon" ? null : loadingLabel ?? children}</> : children}</button>;
}
