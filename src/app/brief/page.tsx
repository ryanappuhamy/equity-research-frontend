import { DataCard } from "@/components/data/data-card";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { demoBrief } from "@/lib/demo";

export default function WeeklyBriefPage() {
  return (
    <Shell>
      <Topbar title={`Weekly brief — ${demoBrief.date}`} demo />

      <div className="flex max-w-3xl flex-col gap-4 p-6">
        {demoBrief.sections.map((s) => (
          <DataCard key={s.title} title={s.title}>
            <p className="text-sm leading-relaxed text-foreground/80">{s.body}</p>
          </DataCard>
        ))}
      </div>
    </Shell>
  );
}
