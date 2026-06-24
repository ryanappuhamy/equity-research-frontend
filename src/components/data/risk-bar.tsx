import { cn } from "@/lib/utils";

// Horizontal contribution bar: label, filled track, percent. Used for risk
// contribution per position and any 0-100% share breakdown.
export function RiskBar({
  label,
  pct,
  color = "var(--chart-1)",
  className,
}: {
  label: string;
  pct: number;
  color?: string;
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, Math.round(pct * 100)));
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="w-16 shrink-0 text-sm font-medium">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {width}%
      </span>
    </div>
  );
}
