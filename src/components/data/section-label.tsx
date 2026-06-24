import { cn } from "@/lib/utils";

// Small uppercase muted header used between blocks (e.g. "Insider activity").
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
