import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function Topbar({
  title,
  subtitle,
  demo,
  actions,
}: {
  title: string;
  subtitle?: string;
  demo?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 pb-2 pt-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance">{title}</h1>
          {demo && (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/5 text-[color:var(--accent-bright)]"
            >
              Demo data
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search ticker…" className="w-56 rounded-full pl-8" />
        </div>
      </div>
    </header>
  );
}
