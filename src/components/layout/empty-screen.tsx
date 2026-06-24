import { cn } from "@/lib/utils";

// Placeholder body for routes whose layout exists but content is not built yet.
// Keeps the modular shell consistent without inventing content.
export function EmptyScreen({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center",
        className,
      )}
    >
      <span className="glow-soft flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
        <Icon className="size-6" />
      </span>
      <h2 className="text-base font-medium">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
