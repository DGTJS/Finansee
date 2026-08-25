import { cn } from "@/lib/utils";

type LoadingIndicatorProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

export function LoadingIndicator({ size = "md", label = "Carregando", className }: LoadingIndicatorProps) {
  const sizes = { sm: "size-4 border-[1.5px]", md: "size-5 border-2", lg: "size-7 border-2" };
  return <span className="inline-flex items-center gap-2" role="status" aria-live="polite"><span aria-hidden="true" className={cn("rounded-full border-current border-b-transparent motion-safe:animate-spin motion-reduce:animate-none", sizes[size], className)} /><span className="sr-only">{label}</span></span>;
}
