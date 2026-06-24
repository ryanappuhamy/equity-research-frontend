import { cn } from "@/lib/utils";

// Marks where an objective fact came from (yfinance / SEC / FRED / Finnhub).
export function SourceBadge({ source, className }: { source?: string | null; className?: string }) {
  if (!source) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {source}
    </span>
  );
}
