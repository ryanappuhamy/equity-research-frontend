import { cn } from "@/lib/utils";

// Plain wordmark — no icon.
export function Logo({
  withWordmark = true,
  className,
}: {
  withWordmark?: boolean;
  className?: string;
}) {
  if (!withWordmark) return null;
  return (
    <span className={cn("whitespace-nowrap text-[15px] font-semibold tracking-tight", className)}>
      Equity Research
    </span>
  );
}
