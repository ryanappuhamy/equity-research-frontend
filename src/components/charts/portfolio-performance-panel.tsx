"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AvailabilityGuard } from "@/components/data/availability-guard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioPerformance } from "@/lib/api/hooks";
import {
  BENCHMARK_TICKERS,
  computeMetrics,
  filterSeriesByPeriod,
  formatChartDate,
  PERFORMANCE_PERIODS,
  reindexSeries,
  type BenchmarkTicker,
  type ChartPoint,
  type PerformancePeriod,
} from "@/lib/portfolio-performance";
import { fmtCurrency, fmtNumber, fmtPercent, signedColor } from "@/lib/format";
import { cn } from "@/lib/utils";

const PORTFOLIO_LINE = "#3b82f6";
const BENCHMARK_LINE = "#64748b";
const CHART_BG = "#0a0f1d";

function formatTooltipDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ChartTooltip({
  active,
  payload,
  benchmarkTicker,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  benchmarkTicker: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1424] px-3.5 py-2.5 shadow-xl">
      <p className="mb-2 text-[11px] font-medium text-muted-foreground">
        {formatTooltipDate(point.date)}
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: PORTFOLIO_LINE }} />
            Portfolio
          </span>
          <span className="font-medium tabular-nums text-white">
            {fmtCurrency(point.rawNav)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: BENCHMARK_LINE }} />
            {benchmarkTicker}
          </span>
          <span className="font-medium tabular-nums text-muted-foreground">
            {fmtCurrency(point.rawBenchmark)}
          </span>
        </div>
      </div>
    </div>
  );
}

function BenchmarkSelector({
  value,
  onChange,
}: {
  value: BenchmarkTicker;
  onChange: (next: BenchmarkTicker) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {BENCHMARK_TICKERS.map((option) => (
        <Button
          key={option}
          type="button"
          size="xs"
          variant="ghost"
          className={cn(
            "min-w-11 px-2.5 font-medium tabular-nums text-muted-foreground hover:text-foreground",
            value === option && "bg-white/[0.06] text-foreground",
          )}
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: PerformancePeriod;
  onChange: (period: PerformancePeriod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERFORMANCE_PERIODS.map((period) => (
        <button
          key={period}
          type="button"
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
            value === period
              ? "bg-[#3b82f6] text-white"
              : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
          )}
          onClick={() => onChange(period)}
        >
          {period}
        </button>
      ))}
    </div>
  );
}

function ChartLegend({ benchmarkTicker }: { benchmarkTicker: string }) {
  return (
    <div className="flex items-center gap-5 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: PORTFOLIO_LINE }} />
        Portfolio
      </span>
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: BENCHMARK_LINE }} />
        {benchmarkTicker}
      </span>
    </div>
  );
}

function PerformanceChart({
  data,
  period,
  benchmarkTicker,
}: {
  data: ChartPoint[];
  period: PerformancePeriod;
  benchmarkTicker: string;
}) {
  const tickFormatter = useMemo(
    () => (value: string) => formatChartDate(value, period),
    [period],
  );

  if (data.length < 2) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Not enough history for the selected period
      </p>
    );
  }

  return (
    <div
      className="h-[300px] w-full rounded-xl border border-white/[0.04] p-3"
      style={{ backgroundColor: CHART_BG }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            dy={8}
            minTickGap={28}
            tickFormatter={tickFormatter}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: "#64748b", fontSize: 11 }}
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => fmtNumber(value, 0)}
          />
          <Tooltip
            content={<ChartTooltip benchmarkTicker={benchmarkTicker} />}
            cursor={{ stroke: "rgba(59,130,246,0.35)", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="nav"
            stroke={PORTFOLIO_LINE}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: PORTFOLIO_LINE, stroke: "#0a0f1d", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            stroke={BENCHMARK_LINE}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: BENCHMARK_LINE, stroke: "#0a0f1d", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalyticsMetricCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function PortfolioPerformancePanel() {
  const [period, setPeriod] = useState<PerformancePeriod>("1Y");
  const [benchmark, setBenchmark] = useState<BenchmarkTicker>("SPY");
  const performance = usePortfolioPerformance(benchmark);

  const benchmarkTicker = performance.data?.benchmark_ticker ?? benchmark;

  const filtered = useMemo(() => {
    const series = performance.data?.series ?? [];
    return filterSeriesByPeriod(series, period);
  }, [performance.data?.series, period]);

  const chartData = useMemo(() => reindexSeries(filtered), [filtered]);
  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
  const isLoading = performance.isPending;

  if (performance.isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        {performance.error instanceof Error
          ? performance.error.message
          : "Failed to load performance history"}
      </p>
    );
  }

  const controls = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Benchmark
          </span>
          <BenchmarkSelector value={benchmark} onChange={setBenchmark} />
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Period
          </span>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>
      <ChartLegend benchmarkTicker={benchmarkTicker} />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {controls}
        <Skeleton className="h-[300px] w-full rounded-xl bg-white/[0.03]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-[88px] rounded-lg bg-white/[0.03]" />
          <Skeleton className="h-[88px] rounded-lg bg-white/[0.03]" />
          <Skeleton className="h-[88px] rounded-lg bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  return (
    <AvailabilityGuard
      available={performance.data?.available !== false && (performance.data?.series?.length ?? 0) > 0}
      note={performance.data?.note}
      emptyLabel="Performance history unavailable"
    >
      <div className="flex flex-col gap-5">
        {controls}

        <PerformanceChart
          data={chartData}
          period={period}
          benchmarkTicker={benchmarkTicker}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AnalyticsMetricCard
            label="Total return"
            value={fmtPercent(metrics.totalReturn, { signed: true })}
            valueClassName={cn(
              metrics.totalReturn != null && metrics.totalReturn > 0
                ? "text-[#3b82f6]"
                : signedColor(metrics.totalReturn),
            )}
          />
          <AnalyticsMetricCard
            label="Sharpe ratio"
            value={metrics.sharpe != null ? fmtNumber(metrics.sharpe, 2) : "—"}
            valueClassName="text-[#3b82f6]"
          />
          <AnalyticsMetricCard
            label="Max drawdown"
            value={fmtPercent(metrics.maxDrawdown, { signed: true })}
            valueClassName={signedColor(metrics.maxDrawdown)}
          />
        </div>
      </div>
    </AvailabilityGuard>
  );
}
