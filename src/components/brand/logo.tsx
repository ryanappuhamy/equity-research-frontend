import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5.5" cy="15" r="1.6" />
        <circle cx="18.5" cy="15" r="1.6" />
        <circle cx="12" cy="13" r="2.4" />
        <circle cx="9" cy="20" r="1.3" />
        <circle cx="15" cy="20" r="1.3" />
      </g>
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.55">
        <path d="M12 7v3.5M11 12 6.5 14M13 12l4.5 2M10.5 15l-1 3.5M13.5 15l1 3.5" />
      </g>
    </svg>
  );
}

export function Logo({
  withWordmark,
  className,
}: {
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="glow-soft relative flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
        <LogoMark />
      </span>
      {withWordmark && (
        <span className="text-sm font-medium tracking-tight">
          Equity<span className="text-primary">Research</span>
        </span>
      )}
    </div>
  );
}
