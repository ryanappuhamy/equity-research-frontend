import { Badge } from "@/components/ui/badge";

// Page title block: large title, optional one-line subtitle and actions.
export function Topbar({
  title,
  subtitle,
  demo,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  demo?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-6 pb-2 pt-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-balance text-[clamp(28px,5vw,40px)] font-semibold leading-tight tracking-[-0.03em]">{title}</h1>
          {demo && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Demo data
            </Badge>
          )}
        </div>
        {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
