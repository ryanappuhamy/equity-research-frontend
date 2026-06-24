import { cn } from "@/lib/utils";

import { SourceBadge } from "./source-badge";

// Wrapper for an objective-fact block. Always free to show its data source,
// so "fact" reads visibly different from AI interpretation (see AICard).
export function DataCard({
  title,
  source,
  action,
  glow,
  className,
  contentClassName,
  children,
}: {
  title?: React.ReactNode;
  source?: string | null;
  action?: React.ReactNode;
  glow?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const hasHeader = Boolean(title || action || source);
  return (
    <section
      className={cn(
        "surface-sheen rounded-xl border border-border bg-card transition-shadow",
        glow && "glow-soft",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div className="flex items-center gap-2">
            {title && <h3 className="text-sm font-medium text-foreground/90">{title}</h3>}
            <SourceBadge source={source} />
          </div>
          {action}
        </header>
      )}
      <div className={cn("px-5 pb-5", !hasHeader && "pt-5", contentClassName)}>{children}</div>
    </section>
  );
}
