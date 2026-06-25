"use client";

import { AICard } from "@/components/data/ai-card";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrief } from "@/lib/api/hooks";

function BriefSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-4 p-6">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export default function WeeklyBriefPage() {
  const { data, isPending, isError, error } = useBrief();

  return (
    <Shell>
      <Topbar title="Weekly brief" />

      {isError && (
        <p className="px-6 pt-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load weekly brief"}
        </p>
      )}

      {isPending ? (
        <BriefSkeleton />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4 p-6">
          <AICard title="Portfolio brief" model="claude-sonnet-4-6">
            <p className="whitespace-pre-wrap">{data?.brief ?? "No brief available."}</p>
          </AICard>
        </div>
      )}
    </Shell>
  );
}
