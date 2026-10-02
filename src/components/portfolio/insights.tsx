"use client";

import { useEffect, useState } from "react";

import type { RiskAnalysis } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { CountUp } from "./count-up";
import { daysUntil, monthShort, num, pct, signedUsd, usd } from "./fmt";
import { RISK_FREE, type Pos, type yearStats } from "./model";

type Stats = NonNullable<ReturnType<typeof yearStats>>;
type Tone = "good" | "warn" | "bad" | "neutral";

const BADGE: Record<Tone, string> = {
  good: "bg-up/15 text-up",
  warn: "bg-warn/15 text-warn",
  bad: "bg-down/15 text-down",
  neutral: "bg-primary/15 text-primary",
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", BADGE[tone])}>{children}</span>;
}

function HealthCard({
  title,
  badge,
  big,
  say,
  mini,
}: {
  title: string;
  badge: [Tone, string];
  big: React.ReactNode;
  say: React.ReactNode;
  mini: [string, string][];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[22px] border border-border bg-card p-[18px]">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[13px] font-medium text-muted-foreground">{title}</span>
        <Badge tone={badge[0]}>{badge[1]}</Badge>
      </div>
      <div className="text-[30px] font-semibold leading-tight tracking-[-0.025em]">{big}</div>
      <p className="text-sm leading-relaxed text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">{say}</p>
      <div className="grid grid-cols-3 gap-2.5 border-t border-border pt-3">
        {mini.map(([k, v]) => (
          <div key={k}>
            <div className="text-[11.5px] text-muted-foreground">{k}</div>
            <div className="font-semibold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Small = ({ children }: { children: React.ReactNode }) => (
  <small className="text-sm font-medium tracking-normal text-muted-foreground">{children}</small>
);

export function HealthCards({
  positions,
  stats,
  risk,
  benchName,
  indexPe,
}: {
  positions: Pos[];
  stats: Stats | null;
  risk?: RiskAnalysis;
  benchName: string;
  indexPe: number | null;
}) {
  const top = [...positions].sort((a, b) => b.weight - a.weight)[0];
  const effN = 1 / positions.reduce((s, p) => s + p.weight * p.weight, 0);
  const stocks = positions.filter((p) => p.sector !== "ETF");
  const tech = positions.filter((p) => p.sector === "Technology").reduce((s, p) => s + p.weight, 0);

  const betaByT = Object.fromEntries((risk?.holdings_risk ?? []).map((h) => [h.ticker, h.beta_vs_spy]));
  const beta = positions.reduce((s, p) => s + p.weight * (betaByT[p.ticker] ?? (p.sector === "ETF" ? 1 : 0)), 0);
  const cm = risk?.correlation_matrix;
  const pairs: number[] = [];
  if (cm) for (let i = 0; i < stocks.length; i++) for (let j = i + 1; j < stocks.length; j++) {
    const c = cm[stocks[i].ticker]?.[stocks[j].ticker];
    if (typeof c === "number") pairs.push(c);
  }
  const avgCorr = pairs.length ? pairs.reduce((s, v) => s + v, 0) / pairs.length : null;

  // Portfolio P/E = 1 / weighted earnings yield. ETFs fall back to the index P/E.
  const peOf = (p: Pos) => p.ins?.pe ?? (p.sector === "ETF" ? indexPe : null) ?? null;
  const peKnown = positions.filter((p) => peOf(p));
  const peW = peKnown.reduce((s, p) => s + p.weight, 0);
  const pe = peKnown.length ? 1 / peKnown.reduce((s, p) => s + p.weight / peW / (peOf(p) as number), 0) : null;
  const fwd = stocks.filter((p) => p.ins?.forward_pe);
  const fwdW = fwd.reduce((s, p) => s + p.weight, 0);
  const fpe = fwd.length ? 1 / fwd.reduce((s, p) => s + p.weight / fwdW / (p.ins!.forward_pe as number), 0) : null;
  const stPe = stocks.filter((p) => p.ins?.pe);
  const stW = stPe.reduce((s, p) => s + p.weight, 0);
  const peStocks = stPe.length ? 1 / stPe.reduce((s, p) => s + p.weight / stW / (p.ins!.pe as number), 0) : null;
  const divY = positions.reduce((s, p) => s + p.weight * (p.ins?.dividend_yield ?? 0), 0);
  const tg = stocks.filter((p) => p.ins?.target_mean);
  const tgW = tg.reduce((s, p) => s + p.weight, 0);
  const upside = tg.length ? tg.reduce((s, p) => s + (p.weight / tgW) * ((p.ins!.target_mean as number) / p.price - 1), 0) : null;

  const cards = [];
  if (stats) {
    const alpha = stats.retP - (RISK_FREE + beta * (stats.retB - RISK_FREE));
    cards.push(
      <HealthCard
        key="ret"
        title="Return vs market"
        badge={stats.retP > stats.retB ? ["good", "Beating the market"] : ["bad", "Behind the market"]}
        big={<>{pct(stats.retP, 0)} <Small>vs {benchName} {pct(stats.retB, 0)}</Small></>}
        say={<>Over the past year the portfolio {stats.retP >= stats.retB ? "beat" : "trailed"} the index by <b>{num(Math.abs(stats.retP - stats.retB) * 100, 0)} points</b>. Return per unit of risk: Sharpe <b>{num(stats.sharpe, 2)}</b> vs {num(stats.sharpeB, 2)}.</>}
        mini={[["Sharpe", num(stats.sharpe, 2)], ["Alpha", pct(alpha, 0)], ["Risk-free rate", "4%"]]}
      />,
      <HealthCard
        key="risk"
        title="Risk"
        badge={beta > 1.5 ? ["warn", "High"] : beta > 1.1 ? ["neutral", "Above average"] : ["good", "In line"]}
        big={`Beta ${num(beta, 1)}`}
        say={<>When the market moves 1%, your portfolio moves <b>{num(beta, 1)}%</b> on average. It swings <b>{num(stats.volP / stats.volB, 1)}x</b> as much as the {benchName}. At its worst point this year it was <b>{pct(-stats.ddP, 0, false)}</b> below its peak.</>}
        mini={[["Max drawdown", pct(stats.ddP, 0)], [`${benchName} drawdown`, pct(stats.ddB, 0)], ["Volatility", pct(stats.volP, 0, false)]]}
      />,
    );
  }
  if (top) cards.push(
    <HealthCard
      key="div"
      title="Diversification"
      badge={top.weight > 0.4 ? ["bad", "Concentrated"] : ["good", "Balanced"]}
      big={<>{pct(top.weight, 0, false)} <Small>in {top.ticker}</Small></>}
      say={<>You hold {positions.length} positions, but the weights behave like <b>{num(effN, 1)}</b>.{avgCorr != null && <> Your stocks move together (average correlation <b>{num(avgCorr, 2)}</b>)</>}{tech > 0 && <>{avgCorr != null ? " and" : ""} tech is <b>{pct(tech, 0, false)}</b> of the total, not counting the tech inside ETFs</>}.</>}
      mini={[["Effective positions", num(effN, 1)], ["Tech weight", pct(tech, 0, false)], ["Largest position", pct(top.weight, 0, false)]]}
    />,
  );
  if (pe) cards.push(
    <HealthCard
      key="val"
      title="Valuation"
      badge={indexPe && pe < indexPe ? ["good", "Cheaper than the index"] : ["warn", "Pricier than the index"]}
      big={<>P/E {num(pe, 1)} {indexPe && <Small>vs S&amp;P {num(indexPe, 1)}</Small>}</>}
      say={<>{peStocks && fpe ? <>On your stocks you pay <b>{Math.round(peStocks)}x</b> current earnings but only <b>{Math.round(fpe)}x</b> expected earnings{fpe < peStocks * 0.8 ? ": the market expects strong earnings growth" : ""}. </> : null}{upside != null && <>Analysts see an average upside of <b>{pct(upside, 0)}</b> on your stocks.</>}</>}
      mini={[["Forward P/E (stocks)", fpe ? num(fpe, 1) : "—"], ["Analyst upside", upside != null ? pct(upside, 0) : "—"], ["Dividend yield", pct(divY, 2, false)]]}
    />,
  );
  return <div className="grid grid-cols-2 gap-3 max-[680px]:grid-cols-1">{cards}</div>;
}

const BAR_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function Contribution({ positions }: { positions: Pos[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);
  const g = positions.reduce((s, p) => s + p.gain, 0);
  const sorted = [...positions].sort((a, b) => b.gain - a.gain);
  if (!sorted.length || g <= 0) return null;
  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] border border-border bg-card p-[18px]">
      {sorted.map((p, i) => (
        <div key={p.ticker} className="grid grid-cols-[52px_minmax(0,1fr)_120px] items-center gap-3">
          <span className="text-sm font-semibold">{p.ticker}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-[width] duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ width: ready ? `${Math.max(0, (p.gain / g) * 100)}%` : 0, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
          <span className="text-right text-[13.5px]">
            {signedUsd(p.gain, 0)} <small className="text-muted-foreground">{pct(p.gain / g, 0, false)}</small>
          </span>
        </div>
      ))}
      <p className="mt-1 text-sm text-muted-foreground">
        {sorted[0].ticker} alone accounts for <b className="font-semibold text-foreground">{pct(sorted[0].gain / g, 0, false)}</b> of your total gain.
      </p>
    </div>
  );
}

/* ---------------- taxes ---------------- */

type Country = {
  flag: string;
  name: string;
  rate: (long: boolean) => number;
  allowance: number; // in USD, approximate
  offset: boolean;
  holdingToggle?: boolean;
  note: (ctx: { long: boolean; dividends: number }) => React.ReactNode;
};

const COUNTRIES: Record<string, Country> = {
  CH: {
    flag: "🇨🇭", name: "Switzerland", rate: () => 0, allowance: 0, offset: false,
    note: ({ dividends }) => <>For private investors <b>capital gains are tax-free</b>. <b>Dividends</b> are taxed as income instead: about <b>{usd(dividends, 0)} a year</b> on your US stocks, with 15% ({usd(dividends * 0.15, 0)}) withheld at source and reclaimable in your tax return. The portfolio also counts toward the <b>wealth tax</b>. Very frequent or leveraged trading can get you classified as a professional trader, and then gains become taxable income.</>,
  },
  IT: {
    flag: "🇮🇹", name: "Italy", rate: () => 0.26, allowance: 0, offset: true,
    note: () => <><b>26%</b> on capital gains (12.5% on government bonds). Losses can offset gains over the <b>following four years</b>: selling a losing position before realizing a gain lowers the tax.</>,
  },
  US: {
    flag: "🇺🇸", name: "USA", rate: (long) => (long ? 0.15 : 0.24), allowance: 0, offset: true, holdingToggle: true,
    note: ({ long }) => long
      ? <>Held <b>more than a year</b>: long-term rate of 0/15/20% depending on income (15% here). Above certain thresholds the 3.8% Net Investment Income Tax applies too.</>
      : <>Held <b>less than a year</b>: the gain is taxed as ordinary income (24% here). Waiting past 12 months often halves the tax.</>,
  },
  DE: {
    flag: "🇩🇪", name: "Germany", rate: () => 0.26375, allowance: 1170, offset: true,
    note: () => <>Flat 25% tax plus solidarity surcharge: <b>26.375%</b> (plus church tax, if any). The first <b>€1,000</b> of investment income each year is tax-free.</>,
  },
  UK: {
    flag: "🇬🇧", name: "United Kingdom", rate: () => 0.24, allowance: 4000, offset: true,
    note: () => <>Capital gains tax of <b>24%</b> for higher-rate taxpayers (18% at the basic rate). The first <b>£3,000</b> of gains each year is tax-free. Gains inside an ISA are not taxed.</>,
  },
};

export function TaxCard({ positions }: { positions: Pos[] }) {
  const [ctry, setCtry] = useState("CH");
  const [long, setLong] = useState(true);
  const c = COUNTRIES[ctry];
  const total = positions.reduce((s, p) => s + p.value, 0);
  const gains = positions.filter((p) => p.gain > 0).reduce((s, p) => s + p.gain, 0);
  const losses = positions.filter((p) => p.gain < 0).reduce((s, p) => s - p.gain, 0);
  const taxable = Math.max(0, (c.offset ? gains - losses : gains) - c.allowance);
  const tax = taxable * c.rate(long);
  const dividends = positions.reduce((s, p) => s + p.value * (p.ins?.dividend_yield ?? 0), 0);

  return (
    <div className="flex flex-col gap-[18px] rounded-[22px] border border-border bg-card p-[18px]">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(COUNTRIES).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => setCtry(k)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all",
              k === ctry ? "border-primary bg-primary/15 text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {v.flag} {v.name}
          </button>
        ))}
      </div>
      {c.holdingToggle && <Toggle checked={long} onChange={setLong} label="Held for more than a year" />}
      <div className="grid grid-cols-3 gap-3 max-[560px]:grid-cols-1">
        <TaxStat k="Gross gain" v={gains - losses} fmt={(v) => signedUsd(v, 0)} className="text-up" />
        <TaxStat k="Estimated tax" v={-tax} fmt={(v) => (tax ? usd(v, 0) : "$0")} />
        <TaxStat k="You would keep" v={total - tax} fmt={(v) => usd(v, 0)} />
      </div>
      <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
        {c.note({ long, dividends })}
      </p>
      <p className="text-xs text-faint">
        Rough estimate using standard rates, not tax advice. Allowances in local currency are converted at an approximate exchange rate.
      </p>
    </div>
  );
}

function TaxStat({ k, v, fmt, className }: { k: string; v: number; fmt: (v: number) => string; className?: string }) {
  return (
    <div>
      <div className="text-[12.5px] text-muted-foreground">{k}</div>
      <CountUp value={v} format={fmt} duration={600} className={cn("text-2xl font-semibold tracking-tight", className)} />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="relative h-5 w-[34px] cursor-pointer appearance-none rounded-full border border-border bg-secondary transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-3.5 after:rounded-full after:bg-muted-foreground after:transition-transform after:duration-300 after:ease-[cubic-bezier(.3,1.4,.5,1)] checked:bg-primary checked:after:translate-x-3.5 checked:after:bg-white"
      />
      {label}
    </label>
  );
}

/* ---------------- information & news ---------------- */

type InfoItem = { date: string; title: string; sub: string; chip: "Financials" | "Performance" };

export function InfoList({ positions }: { positions: Pos[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const items: InfoItem[] = [];
  for (const p of positions) {
    const e = p.ins?.next_earnings;
    if (e?.date) {
      const when = e.hour === "amc" ? "after the close" : e.hour === "bmo" ? "before the open" : "time to be confirmed";
      items.push({ date: e.date, title: `${p.ticker} earnings`, sub: `${when} · in ${daysUntil(e.date)} days`, chip: "Financials" });
    }
    const hi = p.ins?.high_52w;
    if (hi && p.price >= hi * 0.95)
      items.push({ date: today, title: `${p.ticker} near its 52-week high`, sub: `${pct(Math.max(0, 1 - p.price / hi), 1, false)} below the ${usd(hi)} high`, chip: "Performance" });
    if (Math.abs(p.dayPct) >= 0.025)
      items.push({ date: today, title: `${p.ticker} ${p.dayPct > 0 ? "up" : "down"} ${num(Math.abs(p.dayPct) * 100, 1)}% today`, sub: `big move: ${signedUsd(p.dayChange, 0)} on your position`, chip: "Performance" });
  }
  items.sort((a, b) => a.date.localeCompare(b.date));
  if (!items.length) return <p className="text-sm text-muted-foreground">Nothing to report right now.</p>;
  return (
    <div className="flex flex-col">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-border py-3 first:border-t-0 first:pt-0">
          <div className="flex size-14 flex-col items-center justify-center rounded-[14px] bg-secondary leading-none">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{monthShort(it.date)}</span>
            <span className="mt-1 text-[21px] font-semibold">{Number(it.date.slice(8, 10))}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold">{it.title}</div>
            <div className="text-[13px] text-muted-foreground">{it.sub}</div>
          </div>
          <Badge tone={it.chip === "Performance" ? "neutral" : "warn"}>{it.chip}</Badge>
        </div>
      ))}
    </div>
  );
}

// asOf: when the backend built the insights; "3h ago" is measured from it.
export function NewsList({ positions, asOf }: { positions: Pos[]; asOf?: string }) {
  const seen = new Set<string>();
  const news = positions
    .flatMap((p) => (p.ins?.news ?? []).slice(0, 2).map((n) => ({ ...n, ticker: p.ticker })))
    .sort((a, b) => (b.datetime ?? 0) - (a.datetime ?? 0))
    .filter((n) => (seen.has(n.headline) ? false : (seen.add(n.headline), true)))
    .slice(0, 6);
  if (!news.length) return <p className="text-sm text-muted-foreground">No recent news on your holdings.</p>;
  const ago = (ts?: number | null) => {
    if (!ts) return "";
    const ref = asOf ? Date.parse(asOf) / 1000 : ts;
    const h = Math.round((ref - ts) / 3600);
    return h < 24 ? `${Math.max(1, h)}h ago` : `${Math.round(h / 24)}d ago`;
  };
  return (
    <div className="flex flex-col">
      {news.map((n) => (
        <a key={n.headline} href={n.url ?? "#"} target="_blank" rel="noopener" className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 border-t border-border py-3 first:border-t-0 first:pt-0">
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11.5px] font-bold tracking-wide">{n.ticker}</span>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold group-hover:underline">{n.headline}</div>
            <div className="text-[13px] text-muted-foreground">
              {n.source} · {ago(n.datetime)}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export function Advanced({ positions, risk }: { positions: Pos[]; risk?: RiskAnalysis }) {
  const cm = risk?.correlation_matrix;
  const hr = risk?.holdings_risk ?? [];
  if (!cm && !hr.length) return null;
  const T = positions.map((p) => p.ticker).filter((t) => !cm || cm[t]);
  return (
    <details className="group rounded-[22px] border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between px-[18px] py-4 font-semibold [&::-webkit-details-marker]:hidden">
        Advanced analysis
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-300 group-open:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="grid grid-cols-2 gap-5 px-[18px] pb-[18px] max-[680px]:grid-cols-1">
        {cm && (
          <div className="min-w-0">
            <div className="mb-2.5 text-[13px] font-medium text-muted-foreground">Correlation of daily returns</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th />
                    {T.map((t) => <th key={t} className="px-1.5 py-2 text-xs font-medium text-muted-foreground">{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {T.map((a) => (
                    <tr key={a}>
                      <td className="py-2 pr-1.5 text-left">{a}</td>
                      {T.map((b) => {
                        const v = a === b ? 1 : cm[a]?.[b] ?? 0;
                        return (
                          <td key={b} className="rounded-md px-1.5 py-2 text-center font-semibold" style={{ background: `rgba(110,139,255,${(v * 0.55).toFixed(2)})` }}>
                            {num(v, 2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {hr.length > 0 && (
          <div className="min-w-0">
            <div className="mb-2.5 text-[13px] font-medium text-muted-foreground">Risk by holding</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-2 text-left font-medium">Holding</th>
                    <th className="py-2 text-right font-medium">Volatility</th>
                    <th className="py-2 text-right font-medium">Beta</th>
                    <th className="py-2 text-right font-medium">Share of risk</th>
                  </tr>
                </thead>
                <tbody>
                  {hr.map((h) => (
                    <tr key={h.ticker}>
                      <td className="py-2">{h.ticker}</td>
                      <td className="py-2 text-right">{pct(h.annualized_volatility, 0, false)}</td>
                      <td className="py-2 text-right">{num(h.beta_vs_spy, 2)}</td>
                      <td className="py-2 text-right">{pct(h.risk_contribution_pct, 1, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
