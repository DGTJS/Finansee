import { Card, CardContent } from "@/components/ui/card";

type Icon = React.ComponentType<{ className?: string }>;
export function MetricCard({ label, value, detail, icon: Icon, tone = "lime" }: { label: string; value: string; detail?: string; icon: Icon; tone?: "lime" | "info" | "warning" }) {
  return <Card className="relative overflow-hidden"><div className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl ${tone === "lime" ? "bg-primary/15" : tone === "info" ? "bg-status-info/10" : "bg-status-warning/10"}`} /><CardContent className="relative !p-5"><div className="flex items-start justify-between"><div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-5" /></div>{detail && <span className="text-xs font-semibold text-muted-foreground">{detail}</span>}</div><p className="mt-6 text-sm text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p></CardContent></Card>;
}
