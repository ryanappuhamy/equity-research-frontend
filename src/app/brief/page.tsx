"use client";

import { Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BriefMarkdown } from "@/components/data/brief-markdown";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrief, useGenerateBrief, useRegenerateBrief } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

function BriefSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-6 pb-6 pt-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-96 w-full rounded-[22px]" />
    </div>
  );
}

function formatGeneratedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatCacheBadge(cachedAt?: string | null): { fresh: boolean; label: string } {
  if (!cachedAt) return { fresh: false, label: "Dalla cache" };

  const cached = new Date(cachedAt);
  if (Number.isNaN(cached.getTime())) return { fresh: false, label: "Dalla cache" };

  const now = new Date();
  const diffMs = now.getTime() - cached.getTime();
  if (diffMs < 0) return { fresh: true, label: "Aggiornato oggi" };

  if (cached.toDateString() === now.toDateString()) {
    return { fresh: true, label: "Aggiornato oggi" };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return {
      fresh: false,
      label: hours === 1 ? "Di 1 ora fa" : `Di ${hours} ore fa`,
    };
  }

  const days = Math.floor(hours / 24);
  return {
    fresh: false,
    label: days === 1 ? "Di ieri" : `Di ${days} giorni fa`,
  };
}

function FreshnessBadge({ cachedAt }: { cachedAt?: string | null }) {
  const { fresh, label } = formatCacheBadge(cachedAt);
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
        fresh ? "bg-up/15 text-up" : "bg-secondary text-muted-foreground",
      )}
    >
      {label}
    </span>
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
      toast.success("Brief generato");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non è stato possibile generare il brief");
    }
  }

  async function handleRegenerate() {
    try {
      await regenerateBrief.mutateAsync(undefined);
      toast.success("Brief rigenerato");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non è stato possibile rigenerare il brief");
    }
  }

  const showInitialSkeleton = isPending && !isFetched;
  const mutationError = generateBrief.error ?? regenerateBrief.error;

  const pill =
    "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-semibold transition-colors hover:border-muted-foreground disabled:pointer-events-none disabled:opacity-60";

  return (
    <Shell>
      <Topbar
        title="Weekly brief"
        subtitle={
          hasBrief ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              {generatedLabel && <span>{generatedLabel}</span>}
              <FreshnessBadge cachedAt={data?.cached_at} />
            </span>
          ) : (
            "Il riassunto settimanale del tuo portafoglio: notizie, macro e cosa tenere d'occhio."
          )
        }
        actions={
          hasBrief ? (
            <button type="button" className={pill} onClick={handleRegenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {isGenerating ? "Rigenero…" : "Rigenera"}
            </button>
          ) : null
        }
      />

      {(isError || mutationError) && (
        <p className="px-6 pt-2 text-sm text-destructive">
          {isError && error instanceof Error
            ? error.message
            : mutationError instanceof Error
              ? mutationError.message
              : "Impossibile caricare il brief"}
        </p>
      )}

      {showInitialSkeleton ? (
        <BriefSkeleton />
      ) : (
        <div className="flex flex-col gap-6 px-6 pb-6 pt-4">
          {!hasBrief && (
            <div className="animate-rise flex flex-col items-start gap-4 rounded-[22px] border border-border bg-card p-6">
              <span className="flex size-14 items-center justify-center rounded-[18px] bg-secondary">
                <Sparkles className="size-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Nessun brief per questa settimana</h2>
                <p className="mt-1 max-w-[56ch] text-[15px] text-muted-foreground">
                  Genera un brief a partire dalle tue posizioni, dalle notizie recenti e dal contesto macro. Richiede circa un minuto.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-semibold text-background transition-transform active:scale-[.98] disabled:opacity-60"
              >
                {isGenerating && <Loader2 className="size-4 animate-spin" />}
                {isGenerating ? "Genero…" : "Genera il brief"}
              </button>
            </div>
          )}

          {hasBrief && (
            <>
              <article className="animate-rise rounded-[22px] border border-border bg-card px-5 py-6 sm:px-8 sm:py-8" style={{ "--i": 1 } as React.CSSProperties}>
                <div className="mx-auto max-w-[72ch]">
                  <BriefMarkdown content={data?.brief ?? ""} />
                </div>
              </article>
              <p className="text-xs leading-relaxed text-faint">
                Brief generato dall&apos;AI a partire dalle tue posizioni e da dati di mercato pubblici. Ha solo scopo informativo e non è una raccomandazione di acquisto o vendita.
              </p>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
