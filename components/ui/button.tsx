import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "default", size = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "outline"; size?: "default" | "icon" | "sm" }) {
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50", variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90", variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-foreground", variant === "outline" && "border border-border bg-transparent text-foreground hover:bg-accent", size === "icon" && "size-10", size === "sm" && "h-9 px-3 text-sm", size === "default" && "h-11 px-4", className)} {...props} />;
}
