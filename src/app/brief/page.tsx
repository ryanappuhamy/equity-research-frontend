"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AICard } from "@/components/data/ai-card";
import { EmptyScreen } from "@/components/layout/empty-screen";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrief, useGenerateBrief, useRegenerateBrief } from "@/lib/api/hooks";

const FORCE_PASSWORD = "ExtraPls";

function BriefSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-4 p-6">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

function formatGeneratedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function WeeklyBriefPage() {
  const { data, isPending, isError, error, isFetched } = useBrief();
  const generateBrief = useGenerateBrief();
  const regenerateBrief = useRegenerateBrief();

  const isGenerating = generateBrief.isPending || regenerateBrief.isPending;
  const hasBrief = Boolean(data?.brief?.trim());
  const generatedLabel = formatGeneratedAt(data?.generated_at);

  async function handleGenerate() {
    try {
      await generateBrief.mutateAsync();
      toast.success("Brief generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate brief");
    }
  }

  async function handleRegenerate() {
    const password = window.prompt("Enter password to regenerate brief:");
    if (!password) return;
    if (password !== FORCE_PASSWORD) {
      toast.error("Incorrect password");
      return;
    }

    try {
      await regenerateBrief.mutateAsync(FORCE_PASSWORD);
      toast.success("Brief regenerated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate brief");
    }
  }

  const showInitialSkeleton = isPending && !isFetched;
  const mutationError = generateBrief.error ?? regenerateBrief.error;

  return (
    <Shell>
      <Topbar title="Weekly brief" />

      {(isError || mutationError) && (
        <p className="px-6 pt-4 text-sm text-destructive">
          {isError && error instanceof Error
            ? error.message
            : mutationError instanceof Error
              ? mutationError.message
              : "Failed to load weekly brief"}
        </p>
      )}

      {showInitialSkeleton ? (
        <BriefSkeleton />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4 p-6">
          {!hasBrief && (
            <div className="flex flex-col items-center gap-4">
              <EmptyScreen
                icon={Sparkles}
                title="No brief yet"
                description="Generate a portfolio brief from your current holdings and market context."
              />
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate Brief"
                )}
              </Button>
            </div>
          )}

          {hasBrief && (
            <>
              {generatedLabel && (
                <p className="text-sm text-muted-foreground">Generated {generatedLabel}</p>
              )}
              <AICard title="Portfolio brief" model="claude-sonnet-4-6">
                <p className="whitespace-pre-wrap">{data?.brief}</p>
              </AICard>
              <div>
                <Button variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
