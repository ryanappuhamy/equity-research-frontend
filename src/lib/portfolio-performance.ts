import type { NavPoint } from "@/lib/api/types";

export type PerformancePeriod = "1D" | "7D" | "1M" | "6M" | "1Y" | "5Y" | "MAX";

export const BENCHMARK_TICKERS = ["SPY", "QQQ", "SOXX", "VTI"] as const;
export type BenchmarkTicker = (typeof BENCHMARK_TICKERS)[number];

export const PERFORMANCE_PERIODS: PerformancePeriod[] = [
  "1D",
  "7D",
  "1M",
  "6M",
  "1Y",
  "5Y",
  "MAX",
];

const PERIOD_DAYS: Record<Exclude<PerformancePeriod, "MAX">, number> = {
  "1D": 1,
  "7D": 7,
  "1M": 30,
  "6M": 182,
  "1Y": 365,
  "5Y": 365 * 5,
};

export type ChartPoint = {
  date: string;
  nav: number;
  benchmark: number;
  rawNav: number;
  rawBenchmark: number;
};

export type PerformanceMetrics = {
  totalReturn: number | null;
  sharpe: number | null;
  maxDrawdown: number | null;
};

export function filterSeriesByPeriod(
  series: NavPoint[],
  period: PerformancePeriod,
): NavPoint[] {
  if (!series.length || period === "MAX") return series;

  const days = PERIOD_DAYS[period];
  const lastDate = parseDate(series[series.length - 1].date);
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - days);

  return series.filter((point) => parseDate(point.date) >= cutoff);
}

export function reindexSeries(series: NavPoint[]): ChartPoint[] {
  if (!series.length) return [];

  const nav0 = series[0].nav;
  const bench0 = series[0].benchmark;

  return series.map((point) => ({
    date: point.date,
    nav: nav0 > 0 ? (point.nav / nav0) * 100 : 100,
    benchmark: bench0 > 0 ? (point.benchmark / bench0) * 100 : 100,
    rawNav: point.nav,
    rawBenchmark: point.benchmark,
  }));
}

export function computeMetrics(series: NavPoint[]): PerformanceMetrics {
  if (series.length < 2) {
    return { totalReturn: null, sharpe: null, maxDrawdown: null };
  }

  const first = series[0].nav;
  const last = series[series.length - 1].nav;
  const totalReturn = first > 0 ? last / first - 1 : null;

  const returns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].nav;
    const curr = series[i].nav;
    if (prev > 0) returns.push(curr / prev - 1);
  }

  return {
    totalReturn,
    sharpe: computeSharpe(returns),
    maxDrawdown: computeMaxDrawdown(series.map((point) => point.nav)),
  };
}

function computeSharpe(returns: number[]): number | null {
  if (returns.length < 2) return null;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return null;

  return (mean / std) * Math.sqrt(252);
}

function computeMaxDrawdown(values: number[]): number | null {
  if (!values.length) return null;

  let peak = values[0];
  let maxDd = 0;

  for (const value of values) {
    if (value > peak) peak = value;
    const dd = (value - peak) / peak;
    if (dd < maxDd) maxDd = dd;
  }

  return maxDd;
}

export function formatChartDate(date: string, period: PerformancePeriod): string {
  const parsed = parseDate(date);
  if (period === "1D" || period === "7D") {
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (period === "1M" || period === "6M") {
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return parsed.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function parseDate(date: string): Date {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(date) : parsed;
}
