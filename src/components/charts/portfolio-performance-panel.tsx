"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AvailabilityGuard } from "@/components/data/availability-guard";
import { MetricStat } from "@/components/data/metric-stat";
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
  type PerformancePeriod,
} from "@/lib/portfolio-performance";
import { fmtNumber, fmtPercent, signedColor } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV_COLOR = "var(--up)";
const BENCHMARK_COLOR = "var(--chart-4)";

function ChartTooltip({
  active,
  payload,
  label,
  benchmarkTicker,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  benchmarkTicker: string;
}) {
  if (!active || !payload?.length) return null;

  const nav = payload.find((entry) => entry.dataKey === "nav")?.value;
  const benchmark = payload.find((entry) => entry.dataKey === "benchmark")?.value;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 text-muted-foreground">{label}</p>
      {nav != null && (
        <p className="font-medium tabular-nums" style={{ color: NAV_COLOR }}>
          Portfolio {fmtPercent(nav / 100 - 1, { signed: true })}
        </p>
      )}
      {benchmark != null && (
        <p className="font-medium tabular-nums text-muted-foreground">
          {benchmarkTicker} {fmtPercent(benchmark / 100 - 1, { signed: true })}
        </p>
      )}
    </div>
  );
}

function SelectorPills<T extends string>({
  options,
  value,
  onChange,
  minWidthClass = "min-w-9",
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  minWidthClass?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-muted/40 p-1">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          size="xs"
          variant="ghost"
          className={cn(
            minWidthClass,
            "px-2.5 font-medium tabular-nums text-muted-foreground",
            value === option &&
              "bg-card text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
          )}
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

function PerformanceChart({
  data,
  period,
  benchmarkTicker,
}: {
  data: ReturnType<typeof reindexSeries>;
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
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            dy={6}
            minTickGap={28}
            tickFormatter={tickFormatter}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => fmtNumber(value, 0)}
          />
          <Tooltip
            content={<ChartTooltip benchmarkTicker={benchmarkTicker} />}
            cursor={{ stroke: "var(--accent-bright)", strokeOpacity: 0.35 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            formatter={(value) => (
              <span className="text-muted-foreground">
                {value === "nav" ? "Portfolio" : benchmarkTicker}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="nav"
            name="nav"
            stroke={NAV_COLOR}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="benchmark"
            stroke={BENCHMARK_COLOR}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
            Benchmark
          </span>
          <SelectorPills
            options={BENCHMARK_TICKERS}
            value={benchmark}
            onChange={setBenchmark}
            minWidthClass="min-w-11"
          />
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
            Period
          </span>
          <SelectorPills options={PERFORMANCE_PERIODS} value={period} onChange={setPeriod} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Indexed to 100 at period start · vs {benchmarkTicker}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {controls}
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
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
          <div className="rounded-xl border border-white/[0.06] bg-card/90 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <MetricStat
              label="Total return"
              value={
                <span className={signedColor(metrics.totalReturn)}>
                  {fmtPercent(metrics.totalReturn, { signed: true })}
                </span>
              }
              footnote={`${period} period`}
            />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-card/90 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <MetricStat
              label="Sharpe ratio"
              value={metrics.sharpe != null ? fmtNumber(metrics.sharpe, 2) : "—"}
              footnote="annualized"
            />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-card/90 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <MetricStat
              label="Max drawdown"
              value={
                <span className={signedColor(metrics.maxDrawdown)}>
                  {fmtPercent(metrics.maxDrawdown, { signed: true })}
                </span>
              }
              footnote={`${period} period`}
            />
          </div>
        </div>
      </div>
    </AvailabilityGuard>
  );
}
