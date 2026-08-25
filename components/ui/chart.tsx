"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

export function ChartContainer({ config: _config, className, children, ...props }: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactElement }) {
  return <div data-slot="chart" className={cn("flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-tooltip-cursor]:stroke-border [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden", className)} {...props}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

export const ChartTooltip = Tooltip;

export function ChartTooltipContent({ active, payload, label, formatter }: { active?: boolean; payload?: Array<{ dataKey?: string; name?: string; value?: number | string; color?: string }>; label?: React.ReactNode; formatter?: (value: number | string, name?: string) => React.ReactNode }) {
  if (!active || !payload?.length) return null;
  return <div className="grid min-w-40 gap-2 rounded-xl border border-border/60 bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-xl"><p className="font-semibold">{label}</p><div className="grid gap-1.5">{payload.map((item) => <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-muted-foreground"><i className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><strong>{formatter ? formatter(item.value ?? "", item.name) : item.value}</strong></div>)}</div></div>;
}
