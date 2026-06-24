"use client";

import { type FormEvent, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { AICard } from "@/components/data/ai-card";
import { AvailabilityGuard } from "@/components/data/availability-guard";
import { DataCard } from "@/components/data/data-card";
import { MetricStat } from "@/components/data/metric-stat";
import { SectionLabel } from "@/components/data/section-label";
import { EmptyScreen } from "@/components/layout/empty-screen";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useReport } from "@/lib/api/hooks";
import { fmtMultiple, fmtPercent, fmtPrice } from "@/lib/format";

export default function ResearchReportPage() {
  const [input, setInput] = useState("");
  const [ticker, setTicker] = useState("");

  const { data, isFetching, isError, error, refetch } = useReport(ticker, undefined, {
    enabled: !!ticker,
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = input.trim().toUpperCase();
    if (!next) {
      toast.error("Enter a ticker symbol");
      return;
    }
    setTicker(next);
    if (next === ticker) {
      refetch();
    }
  }

  const fundamentals = data?.data?.fundamentals;
  const priceStats = data?.data?.price_stats;
  const insider = data?.data?.insider_activity;
  const relVal = data?.data?.relative_valuation as
    | Record<string, { peer_median?: number }>
    | undefined;
  const peSector = relVal?.pe_ttm?.peer_median;
  const companyName = fundamentals?.company_name ?? ticker;
  const showResults = !!ticker && !isFetching && !!data;

  return (
    <Shell>
      <Topbar title="Research report" />

      <div className="flex flex-col gap-5 p-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="ticker"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search ticker… (e.g. AAPL, NVDA)"
              className="pl-8"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button type="submit" disabled={isFetching}>
            {isFetching ? (
              <>
                <Loader2 className="animate-spin" />
                Loading…
              </>
            ) : (
              "Research"
            )}
          </Button>
        </form>

        {isError && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load report"}
          </p>
        )}

        {!ticker && (
          <EmptyScreen
            icon={Search}
            title="Search a ticker"
            description="Enter a symbol and click Research to run the full pipeline via GET /report/{ticker}."
          />
        )}

        {ticker && isFetching && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        )}

        {showResults && (
          <>
            <div>
              <Badge className="border-primary/30 bg-primary/15 text-[color:var(--accent-bright)]">
                {data.ticker} — {companyName}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <DataCard>
                <AvailabilityGuard available={priceStats?.available} note={priceStats?.note}>
                  <MetricStat
                    label="Price"
                    value={fmtPrice(priceStats?.last_price)}
                    footnote={
                      priceStats?.return_1y != null ? (
                        <span className="text-muted-foreground">
                          {fmtPercent(priceStats.return_1y, { signed: true })} 1Y
                        </span>
                      ) : undefined
                    }
                  />
                </AvailabilityGuard>
              </DataCard>
              <DataCard>
                <AvailabilityGuard available={fundamentals?.available} note={fundamentals?.note}>
                  <MetricStat
                    label="P/E TTM"
                    value={fmtMultiple(fundamentals?.pe_ttm)}
                    footnote={
                      peSector != null
                        ? `vs peers ${fmtMultiple(peSector)}`
                        : fundamentals?.sector
                          ? fundamentals.sector
                          : undefined
                    }
                  />
                </AvailabilityGuard>
              </DataCard>
              <DataCard>
                <AvailabilityGuard available={fundamentals?.available} note={fundamentals?.note}>
                  <MetricStat
                    label="Revenue growth"
                    value={fmtPercent(fundamentals?.revenue_growth_yoy, { signed: true })}
                    footnote="YoY"
                  />
                </AvailabilityGuard>
              </DataCard>
            </div>

            <div className="flex flex-col gap-3">
              <SectionLabel>Insider activity — ultimi 90 giorni</SectionLabel>
              <DataCard source="SEC EDGAR">
                <AvailabilityGuard
                  available={insider?.available}
                  note={insider?.note}
                  emptyLabel="Insider data unavailable"
                >
                  <p className="text-sm text-foreground/80">
                    {"form4_filings_last_6m" in (insider ?? {})
                      ? `${insider?.form4_filings_last_6m ?? 0} Form 4 filings in the last 6 months`
                      : null}
                    {insider?.most_recent_form4
                      ? ` · most recent ${insider.most_recent_form4}`
                      : null}
                  </p>
                </AvailabilityGuard>
              </DataCard>
            </div>

            <div className="flex flex-col gap-3">
              <SectionLabel>AI research note</SectionLabel>
              <AICard model="claude-sonnet-4-6">
                <p className="whitespace-pre-wrap leading-relaxed">{data.report}</p>
              </AICard>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
