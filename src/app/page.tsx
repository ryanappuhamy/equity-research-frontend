"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { AICard } from "@/components/data/ai-card";
import { AvailabilityGuard } from "@/components/data/availability-guard";
import { DataCard } from "@/components/data/data-card";
import { MetricStat } from "@/components/data/metric-stat";
import { ResearchReportLoading } from "@/components/data/research-report-loading";
import { SectionLabel } from "@/components/data/section-label";
import { EmptyScreen } from "@/components/layout/empty-screen";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReport } from "@/lib/api/hooks";
import { fmtMultiple, fmtPercent, fmtPrice } from "@/lib/format";

const RECENT_TICKERS_KEY = "recentTickers";
const MAX_RECENT_TICKERS = 6;

function readRecentTickers(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_TICKERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.toUpperCase())
      .slice(0, MAX_RECENT_TICKERS);
  } catch {
    return [];
  }
}

function writeRecentTickers(tickers: string[]) {
  localStorage.setItem(RECENT_TICKERS_KEY, JSON.stringify(tickers));
}

function addRecentTicker(tickers: string[], ticker: string): string[] {
  return [ticker, ...tickers.filter((item) => item !== ticker)].slice(0, MAX_RECENT_TICKERS);
}

export default function ResearchReportPage() {
  const [input, setInput] = useState("");
  const [ticker, setTicker] = useState("");
  const [recentTickers, setRecentTickers] = useState<string[]>([]);

  const { data, isFetching, isError, error, refetch } = useReport(ticker, undefined, {
    enabled: !!ticker,
  });

  useEffect(() => {
    setRecentTickers(readRecentTickers());
  }, []);

  useEffect(() => {
    if (!ticker || isFetching || isError || !data) return;

    setRecentTickers((prev) => {
      const next = addRecentTicker(prev, ticker);
      writeRecentTickers(next);
      return next;
    });
  }, [ticker, isFetching, isError, data]);

  function searchTicker(next: string) {
    const normalized = next.trim().toUpperCase();
    if (!normalized) {
      toast.error("Enter a ticker symbol");
      return;
    }
    setInput(normalized);
    setTicker(normalized);
    if (normalized === ticker) {
      refetch();
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    searchTicker(input);
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
        <div className="flex flex-col gap-3">
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

          {recentTickers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Recent searches</span>
              {recentTickers.map((recent) => (
                <Badge
                  key={recent}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  render={
                    <button
                      type="button"
                      onClick={() => searchTicker(recent)}
                      disabled={isFetching}
                    />
                  }
                >
                  {recent}
                </Badge>
              ))}
            </div>
          )}
        </div>

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

        {ticker && isFetching && <ResearchReportLoading active />}

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
