import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

// Wrapper for Claude-generated interpretation. Deliberately distinct from
// DataCard (accent border + model badge) so the user always knows what is
// objective data vs what is AI analysis.
export function AICard({
  title = "Analisi AI",
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
        "relative overflow-hidden rounded-[22px] border border-border bg-card",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent" />
      <header className="relative flex items-center justify-between gap-3 px-[18px] pb-3 pt-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {model && (
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-primary">
            {model}
          </span>
        )}
      </header>
      <div className="relative px-[18px] pb-5 text-[15px] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}
