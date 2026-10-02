import type { HoldingInsight, NavPoint } from "@/lib/api/types";

// One holding with everything the Portfolio page derives from it.
export type Pos = {
  ticker: string;
  shares: number;
  avg: number;
  price: number;
  value: number;
  cost: number;
  gain: number;
  weight: number;
  dayChange: number; // $ change today
  dayPct: number; // ratio
  sector: string | null;
  ins?: HoldingInsight;
};

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
export const stdev = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1));
};
const returns = (a: number[]) => a.slice(1).map((v, i) => v / a[i] - 1);
const maxDrawdown = (a: number[]) => {
  let peak = a[0];
  let worst = 0;
  for (const v of a) {
    peak = Math.max(peak, v);
    worst = Math.min(worst, v / peak - 1);
  }
  return worst;
};

export const RISK_FREE = 0.04;

// Trailing-year stats from the NAV series (backtest of current holdings).
export function yearStats(series: NavPoint[]) {
  const s = series.slice(-253);
  if (s.length < 30) return null;
  const nav = s.map((p) => p.nav);
  const bm = s.map((p) => p.benchmark);
  const rP = returns(nav);
  const rB = returns(bm);
  const volP = stdev(rP) * Math.sqrt(252);
  const volB = stdev(rB) * Math.sqrt(252);
  const retP = nav[nav.length - 1] / nav[0] - 1;
  const retB = bm[bm.length - 1] / bm[0] - 1;
  return {
    retP,
    retB,
    volP,
    volB,
    sharpe: (retP - RISK_FREE) / volP,
    sharpeB: (retB - RISK_FREE) / volB,
    ddP: maxDrawdown(nav),
    ddB: maxDrawdown(bm),
  };
}
