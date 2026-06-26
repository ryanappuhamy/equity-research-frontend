"use client";

import { Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BriefMarkdown } from "@/components/data/brief-markdown";
import { EmptyScreen } from "@/components/layout/empty-screen";
import { Shell } from "@/components/layout/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrief, useGenerateBrief, useRegenerateBrief } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

function BriefSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}

function formatGeneratedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatCacheBadge(cachedAt?: string | null): { fresh: boolean; label: string } {
  if (!cachedAt) return { fresh: false, label: "Cached" };

  const cached = new Date(cachedAt);
  if (Number.isNaN(cached.getTime())) return { fresh: false, label: "Cached" };

  const now = new Date();
  const diffMs = now.getTime() - cached.getTime();
  if (diffMs < 0) return { fresh: true, label: "Fresh" };

  if (cached.toDateString() === now.toDateString()) {
    return { fresh: true, label: "Fresh" };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return {
      fresh: false,
      label: hours === 1 ? "Cached 1 hour ago" : `Cached ${hours} hours ago`,
    };
  }

  const days = Math.floor(hours / 24);
  return {
    fresh: false,
    label: days === 1 ? "Cached 1 day ago" : `Cached ${days} days ago`,
  };
}

function FreshnessBadge({ cachedAt }: { cachedAt?: string | null }) {
  const { fresh, label } = formatCacheBadge(cachedAt);

  if (fresh) {
    return (
      <Badge variant="outline" className="border-up/30 bg-up/10 text-up">
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-border/60 bg-muted/20 text-muted-foreground">
      {label}
    </Badge>
  );
}

export default function WeeklyBriefPage() {
  const { data, isPending, isError, error, isFetched } = useBrief();
  const generateBrief = useGenerateBrief();
  const regenerateBrief = useRegenerateBrief();

  const isGenerating = generateBrief.isPending || regenerateBrief.isPending;
  const hasBrief = Boolean(data?.brief?.trim());
  const generatedLabel = formatGeneratedAt(data?.generated_at ?? data?.cached_at);

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
    if (password !== "ExtraPls") {
      toast.error("Incorrect password");
      return;
    }

    try {
      await regenerateBrief.mutateAsync("ExtraPls");
      toast.success("Brief regenerated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate brief");
    }
  }

  const showInitialSkeleton = isPending && !isFetched;
  const mutationError = generateBrief.error ?? regenerateBrief.error;

  return (
    <Shell>
      {(isError || mutationError) && (
        <p className="px-4 pt-4 text-sm text-destructive sm:px-6">
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
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {!hasBrief && (
            <div className="flex flex-col items-center gap-4 py-8">
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
              <header className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      Weekly Brief
                    </h1>
                    <FreshnessBadge cachedAt={data?.cached_at} />
                  </div>
                  {generatedLabel && (
                    <p className="text-sm text-muted-foreground">{generatedLabel}</p>
                  )}
                </div>

                <Button
                  variant="outline"
                  className={cn(
                    "w-full shrink-0 border-white/[0.08] bg-card/60 sm:w-auto",
                    isGenerating && "pointer-events-none",
                  )}
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              </header>

              <article className="rounded-2xl border border-white/[0.06] bg-card/50 px-4 py-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:px-6 sm:py-8">
                <BriefMarkdown content={data?.brief ?? ""} />
              </article>

              <footer className="border-t border-white/[0.06] pt-4">
                <p className="text-center text-xs leading-relaxed text-muted-foreground/70 sm:text-left">
                  This weekly brief is AI-generated from your portfolio holdings and public market
                  data. It is for informational purposes only and does not constitute investment
                  advice, an offer, or a recommendation to buy or sell any security.
                </p>
              </footer>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
