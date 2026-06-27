"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SectorAllocationChart } from "@/components/charts/sector-allocation-chart";
import { AvailabilityGuard } from "@/components/data/availability-guard";
import { DataCard } from "@/components/data/data-card";
import { DataTable, type Column } from "@/components/data/data-table";
import { Delta } from "@/components/data/delta";
import { MetricStat } from "@/components/data/metric-stat";
import { RiskBar } from "@/components/data/risk-bar";
import { SectionLabel } from "@/components/data/section-label";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, usePortfolioAnalysis, useSavePortfolio } from "@/lib/api/hooks";
import type { Holding, RiskScenario } from "@/lib/api/types";
import { fmtCurrency, fmtPercent, fmtPrice } from "@/lib/format";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--up)",
  "#e0894a",
];

const basePositionColumns: Column<Holding>[] = [
  {
    key: "ticker",
    header: "Ticker",
    cell: (h) => <span className="font-medium text-foreground">{h.ticker}</span>,
  },
  {
    key: "shares",
    header: "Shares",
    align: "right",
    cell: (h) => <span className="tabular-nums text-muted-foreground">{h.shares}</span>,
  },
  {
    key: "avg",
    header: "Avg cost",
    align: "right",
    cell: (h) => <span className="tabular-nums">{fmtPrice(h.avg_cost_price)}</span>,
  },
  {
    key: "price",
    header: "Price",
    align: "right",
    cell: (h) => <span className="tabular-nums">{fmtPrice(h.current_price)}</span>,
  },
  {
    key: "value",
    header: "Mkt value",
    align: "right",
    cell: (h) => <span className="tabular-nums">{fmtCurrency(h.market_value)}</span>,
  },
  {
    key: "weight",
    header: "Weight",
    align: "right",
    cell: (h) => <span className="tabular-nums text-muted-foreground">{fmtPercent(h.weight)}</span>,
  },
  {
    key: "pnl",
    header: "P&L",
    align: "right",
    cell: (h) => (
      <div className="flex flex-col items-end">
        <span className={`tabular-nums ${(h.pnl ?? 0) >= 0 ? "text-up" : "text-down"}`}>
          {fmtCurrency(h.pnl)}
        </span>
        <Delta value={h.pnl_pct} />
      </div>
    ),
  },
];

type SavePosition = Pick<Holding, "ticker" | "shares" | "avg_cost_price">;

function toSavePayload(positions: Holding[]): SavePosition[] {
  return positions.map(({ ticker, shares, avg_cost_price }) => ({
    ticker,
    shares,
    avg_cost_price,
  }));
}

function parseDecimalInput(value: string): number {
  return Number(value.replace(/,/g, "."));
}

function computeTotals(positions: Holding[]) {
  const value = positions.reduce((s, h) => s + (h.market_value ?? 0), 0);
  const cost = positions.reduce((s, h) => s + (h.cost_basis ?? 0), 0);
  const pnl = value - cost;
  return { value, pnlPct: cost ? pnl / cost : 0 };
}

function scenarioLabel(key: string, scenario: RiskScenario): string {
  return scenario.description || key.replace(/_/g, " ");
}

function findCrashImpact(
  scenarios: Record<string, RiskScenario> | undefined,
  portfolioValue: number,
): number | null {
  if (!scenarios || portfolioValue === 0) return null;

  const entries = Object.entries(scenarios);
  const marketCrash =
    entries.find(([k]) => k.includes("market") && (k.includes("20") || k.includes("crash"))) ??
    entries.find(([, s]) => s.estimated_portfolio_return < 0);

  if (!marketCrash) return null;
  return portfolioValue * marketCrash[1].estimated_portfolio_return;
}

function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-48" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-40" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");

  const portfolio = usePortfolio();
  const analysis = usePortfolioAnalysis();
  const savePortfolio = useSavePortfolio();

  const isLoading = portfolio.isPending || analysis.isPending;
  const isError = portfolio.isError || analysis.isError;
  const error = portfolio.error ?? analysis.error;

  const positions = portfolio.data?.positions ?? [];
  const risk = analysis.data?.risk;
  const totals = useMemo(() => computeTotals(positions), [positions]);

  async function savePositions(next: SavePosition[]) {
    await savePortfolio.mutateAsync(next);
  }

  async function handleAddPosition() {
    const nextTicker = ticker.trim().toUpperCase();
    const parsedShares = parseDecimalInput(shares);
    const parsedAvgCost = parseDecimalInput(avgCost);

    if (!nextTicker || !shares || !avgCost) {
      toast.error("Enter ticker, shares, and avg cost price");
      return;
    }
    if (!Number.isFinite(parsedShares) || parsedShares <= 0) {
      toast.error("Invalid shares");
      return;
    }
    if (!Number.isFinite(parsedAvgCost) || parsedAvgCost <= 0) {
      toast.error("Invalid avg cost price");
      return;
    }

    const withoutDuplicate = positions.filter((p) => p.ticker !== nextTicker);
    const updated = [
      ...toSavePayload(withoutDuplicate),
      { ticker: nextTicker, shares: parsedShares, avg_cost_price: parsedAvgCost },
    ];

    try {
      await savePositions(updated);
      toast.success(`Position added for ${nextTicker}`);
      setTicker("");
      setShares("");
      setAvgCost("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add position");
    }
  }

  async function handleDeletePosition(tickerToDelete: string) {
    const updated = toSavePayload(positions.filter((p) => p.ticker !== tickerToDelete));

    try {
      await savePositions(updated);
      toast.success(`Position removed for ${tickerToDelete}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove position");
    }
  }

  const positionColumns: Column<Holding>[] = useMemo(
    () => [
      ...basePositionColumns,
      {
        key: "actions",
        header: "",
        align: "right",
        cell: (h) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete position for ${h.ticker}`}
            disabled={savePortfolio.isPending}
            onClick={() => handleDeletePosition(h.ticker)}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        ),
      },
    ],
    [positions, savePortfolio.isPending],
  );

  const crashImpact = useMemo(
    () => findCrashImpact(risk?.scenarios, totals.value),
    [risk?.scenarios, totals.value],
  );

  const scenarioRows = useMemo(() => {
    if (!risk?.scenarios || totals.value === 0) return [];
    return Object.entries(risk.scenarios).map(([key, s]) => ({
      key,
      label: scenarioLabel(key, s),
      value: totals.value * s.estimated_portfolio_return,
    }));
  }, [risk?.scenarios, totals.value]);

  const contributions = risk?.holdings_risk ?? [];

  return (
    <Shell>
      <Topbar title="Portfolio analysis" />

      {isError && (
        <p className="px-6 pt-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load portfolio"}
        </p>
      )}

      {isLoading ? (
        <PortfolioSkeleton />
      ) : (
        <div className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DataCard>
              <AvailabilityGuard
                available={portfolio.data?.available}
                note={portfolio.data?.note}
                emptyLabel="Portfolio unavailable"
              >
                <MetricStat
                  label="Valore totale"
                  value={fmtCurrency(totals.value)}
                  footnote={
                    <span className={totals.pnlPct >= 0 ? "text-up" : "text-down"}>
                      {fmtPercent(totals.pnlPct, { signed: true })} cost basis
                    </span>
                  }
                />
              </AvailabilityGuard>
            </DataCard>
            <DataCard>
              <AvailabilityGuard
                available={risk?.available}
                note={risk?.note}
                emptyLabel="Risk metrics unavailable"
              >
                <MetricStat
                  label="Vol. annualizzata"
                  value={fmtPercent(risk?.portfolio_annualized_volatility)}
                  footnote="portafoglio"
                />
              </AvailabilityGuard>
            </DataCard>
            <DataCard>
              <AvailabilityGuard
                available={risk?.available}
                note={risk?.note}
                emptyLabel="Scenario analysis unavailable"
              >
                <MetricStat
                  label="Scenario -20%"
                  value={
                    crashImpact != null ? (
                      <span className="text-down">{fmtCurrency(crashImpact)}</span>
                    ) : (
                      "—"
                    )
                  }
                  footnote="market crash"
                />
              </AvailabilityGuard>
            </DataCard>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Posizioni</SectionLabel>
            <DataCard source="yfinance" contentClassName="px-2">
              <AvailabilityGuard
                available={portfolio.data?.available}
                note={portfolio.data?.note}
                emptyLabel="Positions unavailable"
              >
                <DataTable
                  columns={positionColumns}
                  rows={positions}
                  getRowKey={(h) => h.ticker}
                />
              </AvailabilityGuard>
            </DataCard>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Sector allocation</SectionLabel>
            <DataCard source="yfinance">
              <AvailabilityGuard
                available={portfolio.data?.available}
                note={portfolio.data?.note}
                emptyLabel="Sector allocation unavailable"
              >
                <SectorAllocationChart positions={positions} />
              </AvailabilityGuard>
            </DataCard>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Add position</SectionLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-32"
              />
              <Input
                placeholder="Shares"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                inputMode="decimal"
                className="w-28"
              />
              <Input
                placeholder="Avg cost"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                inputMode="decimal"
                className="w-32"
              />
              <Button onClick={handleAddPosition} disabled={savePortfolio.isPending}>
                {savePortfolio.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Add position…
                  </>
                ) : (
                  <>
                    Add position
                    <ArrowUpRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Risk contribution per posizione</SectionLabel>
            <DataCard source="yfinance">
              <AvailabilityGuard
                available={risk?.available}
                note={risk?.note}
                emptyLabel="Risk contribution unavailable"
              >
                <div className="flex flex-col gap-4">
                  {contributions.map((c, i) => (
                    <RiskBar
                      key={c.ticker}
                      label={c.ticker}
                      pct={c.risk_contribution_pct}
                      color={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </div>
              </AvailabilityGuard>
            </DataCard>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Scenario analysis</SectionLabel>
            <DataCard>
              <AvailabilityGuard
                available={risk?.available}
                note={risk?.note}
                emptyLabel="Scenario analysis unavailable"
              >
                <div className="flex flex-col divide-y divide-border/60">
                  {scenarioRows.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm">{s.label}</span>
                      <span
                        className={`text-sm tabular-nums ${s.value < 0 ? "text-down" : "text-foreground"}`}
                      >
                        {fmtCurrency(s.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </AvailabilityGuard>
            </DataCard>
          </div>
        </div>
      )}
    </Shell>
  );
}
