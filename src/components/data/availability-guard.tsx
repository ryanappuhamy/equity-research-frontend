import { CircleDashed } from "lucide-react";

// The backend returns { available: false, note } for any block it could not
// fill. This renders that as a first-class empty state instead of an error,
// matching the backend's graceful-degradation contract.
export function AvailabilityGuard({
  available,
  note,
  emptyLabel = "Data unavailable",
  children,
}: {
  available?: boolean;
  note?: string | null;
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  if (available === false) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <CircleDashed className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground/70">{emptyLabel}</p>
        {note && <p className="max-w-xs text-xs text-muted-foreground">{note}</p>}
      </div>
    );
  }
  return <>{children}</>;
}
