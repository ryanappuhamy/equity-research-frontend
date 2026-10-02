import { cn } from "@/lib/utils";

// Section heading used between blocks (e.g. "Insider activity").
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
        "text-[19px] font-semibold tracking-tight text-foreground text-balance",
        className,
      )}
    >
      {children}
    </p>
  );
}
