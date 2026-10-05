"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Download, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { TradingViewAdvancedChart } from "@/components/charts/tradingview-advanced-chart";
import { AICard } from "@/components/data/ai-card";
import { AvailabilityGuard } from "@/components/data/availability-guard";
import { BriefMarkdown } from "@/components/data/brief-markdown";
import { DataCard } from "@/components/data/data-card";
import { InsiderActivityTable } from "@/components/data/insider-activity-table";
import { ReportMetricCards } from "@/components/data/report-metric-cards";
import { ResearchReportLoading } from "@/components/data/research-report-loading";
import { SectionLabel } from "@/components/data/section-label";
import { TickerNews } from "@/components/data/ticker-news";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { CountUp } from "@/components/portfolio/count-up";
import { pct, toneClass, usd } from "@/components/portfolio/fmt";
import { useClearReportCache, usePortfolio, useReport } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { downloadResearchReportPdf } from "@/lib/report-pdf";

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
  const { data: portfolio } = usePortfolio();
  const ownTickers = (portfolio?.positions ?? []).map((p) => p.ticker.toUpperCase());

  const { data, isFetching, isError, error, refetch } = useReport(ticker, undefined, {
    enabled: !!ticker,
  });
  const clearReportCache = useClearReportCache();

  useEffect(() => {
    setRecentTickers(readRecentTickers());
    // Deep link from the Portfolio page: /?ticker=NVDA opens that report.
    const fromLink = new URLSearchParams(window.location.search).get("ticker")?.trim().toUpperCase();
    if (fromLink) {
      setInput(fromLink);
      setTicker(fromLink);
    }
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
  const companyName = fundamentals?.company_name ?? ticker;
  const showResults = !!ticker && !isFetching && !!data;
  const metricUnavailable =
    priceStats?.available === false || fundamentals?.available === false;

  async function handleRetryLoad() {
    try {
      await clearReportCache.mutateAsync({ ticker });
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear cache and retry");
    }
  }

  function handleDownloadPdf() {
    if (!data) return;
    try {
      downloadResearchReportPdf(data, companyName);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate PDF");
    }
  }

  const suggestions = [...new Set([...ownTickers, ...recentTickers, "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "TSLA"])].slice(0, 10);
  const price = priceStats?.last_price;
  const ret1y = priceStats?.return_1y;
  const lo52 = priceStats?.low_52w;
  const hi52 = priceStats?.high_52w;
  const rangePos = price != null && lo52 && hi52 ? Math.max(0, Math.min(1, (price - lo52) / (hi52 - lo52))) : null;
  const pill = "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-semibold transition-colors hover:border-muted-foreground disabled:opacity-50";

  return (
    <Shell>
      <Topbar title="Research" subtitle="A full read on any stock: price, fundamentals, insider activity and an AI research note." />

      <div className="flex flex-col gap-7 px-6 pb-6 pt-4">
        <div className="animate-rise flex flex-col gap-3">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              name="ticker"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search a ticker, for example AAPL or NVDA"
              autoComplete="off"
              spellCheck={false}
              className="h-14 w-full rounded-full border border-border bg-card pl-14 pr-36 text-[16px] text-foreground outline-none transition-colors placeholder:text-faint focus:border-primary"
            />
            <button
              type="submit"
              disabled={isFetching}
              className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition-transform active:scale-[.97] disabled:opacity-60"
            >
              {isFetching ? <Loader2 className="size-4 animate-spin" /> : null}
              {isFetching ? "Analyzing…" : "Analyze"}
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {suggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => searchTicker(t)}
                disabled={isFetching}
                className={cn(
                  "rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors disabled:opacity-50",
                  t === ticker ? "border-primary bg-primary/15 text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {isError && (
          <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load the report"}</p>
        )}

        {!ticker && (
          <div className="animate-rise flex flex-col gap-2 rounded-[22px] border border-border bg-card p-6" style={{ "--i": 1 } as React.CSSProperties}>
            <h2 className="text-xl font-semibold tracking-tight">Pick a stock to analyze</h2>
            <p className="max-w-[60ch] text-[15px] text-muted-foreground">
              The report brings together price action, valuation, growth, profitability, financial health, insider buying and selling, and a note written by AI. The first analysis of a ticker can take up to a minute.
            </p>
          </div>
        )}

        {ticker && isFetching && <ResearchReportLoading active />}

        {showResults && (
          <>
            <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-[13px] font-medium text-muted-foreground">
                  {data.ticker} · {companyName}
                </span>
                {price != null ? (
                  <CountUp
                    value={price}
                    format={(v) => usd(v)}
                    className="text-[clamp(40px,8vw,64px)] font-semibold leading-none tracking-[-0.035em]"
                  />
                ) : (
                  <span className="text-4xl font-semibold">—</span>
                )}
                {ret1y != null && !Number.isNaN(ret1y) && (
                  <span className={cn("mt-1 text-[15px] font-semibold", toneClass(ret1y))}>
                    {ret1y >= 0 ? "▲" : "▼"} {pct(ret1y)} <span className="font-medium text-muted-foreground">over the past year</span>
                  </span>
                )}
                {rangePos != null && (
                  <div className="mt-3 w-[min(320px,80vw)]">
                    <div className="relative h-1.5 rounded-full bg-secondary">
                      <i className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground transition-[left] duration-700" style={{ left: `${rangePos * 100}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[11px] text-faint">
                      <span>52-week low {usd(lo52!, 0)}</span>
                      <span>high {usd(hi52!, 0)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleDownloadPdf} className={pill}>
                  <Download className="size-4" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleRetryLoad}
                  disabled={clearReportCache.isPending || isFetching}
                  title="Clear the cache and rebuild the report from scratch"
                  className={pill}
                >
                  <RefreshCw className={cn("size-4", (clearReportCache.isPending || isFetching) && "animate-spin")} />
                  {clearReportCache.isPending || isFetching ? "Regenerating…" : "Regenerate"}
                </button>
              </div>
            </div>

            {metricUnavailable && (
              <p className="-mt-3 text-[13px] text-muted-foreground">
                Some data is unavailable: try &ldquo;Regenerate&rdquo; to run the research again.
              </p>
            )}

            <div className="animate-rise overflow-hidden rounded-[22px] border border-border bg-card" style={{ "--i": 1 } as React.CSSProperties}>
              <TradingViewAdvancedChart ticker={data.ticker} />
            </div>

            <section className="animate-rise flex flex-col gap-3" style={{ "--i": 2 } as React.CSSProperties}>
              <SectionLabel>Fundamentals</SectionLabel>
              <ReportMetricCards fundamentals={fundamentals} />
            </section>

            <section className="animate-rise flex flex-col gap-3" style={{ "--i": 3 } as React.CSSProperties}>
              <SectionLabel>Insider activity: last 6 months</SectionLabel>
              <DataCard source="SEC EDGAR">
                <AvailabilityGuard available={insider?.available} note={insider?.note} emptyLabel="Insider data unavailable">
                  <InsiderActivityTable activity={insider} />
                </AvailabilityGuard>
              </DataCard>
            </section>
            <section className="animate-rise flex flex-col gap-3" style={{ "--i": 4 } as React.CSSProperties}>
              <SectionLabel>Recent news</SectionLabel>
              <TickerNews ticker={data.ticker} />
            </section>

            <section className="animate-rise flex flex-col gap-3" style={{ "--i": 5 } as React.CSSProperties}>
              <SectionLabel>Research note</SectionLabel>
              <AICard model={data.report_model ?? undefined}>
                <BriefMarkdown content={data.report} />
              </AICard>
            </section>

          </>
        )}
      </div>
    </Shell>
  );
}
