import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

// Wrapper for Claude-generated interpretation. Deliberately distinct from
// DataCard (accent border + model badge) so the user always knows what is
// objective data vs what is AI analysis.
export function AICard({
  title = "AI interpretation",
  model,
  className,
  children,
}: {
  title?: string;
  model?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/25 bg-card",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/50" />
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        {model && (
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-[color:var(--accent-bright)]">
            {model}
          </span>
        )}
      </header>
      <div className="px-5 pb-5 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}
