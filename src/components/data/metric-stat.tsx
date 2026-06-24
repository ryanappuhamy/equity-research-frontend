import { AreaSpark } from "@/components/charts/area-spark";
import { cn } from "@/lib/utils";

import { Delta } from "./delta";

// The "No. of Payments  59  ↑12.8%" cell from the reference, generalized.
export function MetricStat({
  label,
  value,
  delta,
  deltaIsRatio = true,
  footnote,
  spark,
  sparkColor,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  deltaIsRatio?: boolean;
  footnote?: React.ReactNode;
  spark?: number[];
  sparkColor?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-medium tracking-tight tabular-nums">{value}</span>
        {delta !== undefined && delta !== null && <Delta value={delta} isRatio={deltaIsRatio} />}
      </div>
      {footnote && <span className="text-xs text-muted-foreground">{footnote}</span>}
      {spark && spark.length > 1 && (
        <div className="mt-1 h-8 w-full">
          <AreaSpark data={spark} color={sparkColor} />
        </div>
      )}
    </div>
  );
}
