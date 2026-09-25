import { fmtPercent } from "@/lib/format";
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
  // Bar is clamped to 0-100; the label keeps one decimal so small (e.g. 0.3%)
  // or negative (hedging) contributions don't read as a flat "0%".
  const width = Math.max(0, Math.min(100, pct * 100));
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="w-16 shrink-0 text-sm font-medium">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {fmtPercent(pct)}
      </span>
    </div>
  );
}
