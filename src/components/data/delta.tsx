import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { deltaDirection, fmtPercent } from "@/lib/format";

export function Delta({
  value,
  isRatio = true,
  className,
}: {
  value?: number | null;
  isRatio?: boolean;
  className?: string;
}) {
  const dir = deltaDirection(value);
  if (dir === "flat") {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }
  const up = dir === "up";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        up ? "text-up" : "text-down",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {fmtPercent(Math.abs(value as number), { isRatio })}
    </span>
  );
}
