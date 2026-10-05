"use client";

import { useMemo, useState } from "react";

import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { CountUp } from "@/components/portfolio/count-up";
import { fmtDate, pct, signedUsd, toneClass, usd } from "@/components/portfolio/fmt";
import { Toggle } from "@/components/portfolio/insights";
import { LineChart } from "@/components/portfolio/line-chart";
import { stdev } from "@/components/portfolio/model";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyHistory, usePortfolio } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

// ter: the fund's annual expense ratio in percent (issuer figures). Single stocks have none.
const INDEXES = [
  { t: "SPY", name: "S&P 500", ter: 0.0945 },
  { t: "URTH", name: "MSCI World", ter: 0.24 },
  { t: "VT", name: "All-World", ter: 0.06 },
  { t: "QQQ", name: "Nasdaq 100", ter: 0.2 },
];

// Capital-gains rate applied to the final gain (same defaults as the Portfolio tax card).
const TAX = [
  { k: "CH", label: "🇨🇭 Switzerland", rate: 0 },
  { k: "IT", label: "🇮🇹 Italy", rate: 0.26 },
  { k: "US", label: "🇺🇸 USA", rate: 0.15 },
  { k: "DE", label: "🇩🇪 Germany", rate: 0.26375 },
  { k: "UK", label: "🇬🇧 United Kingdom", rate: 0.24 },
];

function addMonths(ym: string, k: number) {
  let [y, m] = ym.split("-").map(Number);
  m += k;
  y += Math.floor((m - 1) / 12);
  m = (((m - 1) % 12) + 12) % 12 + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

// Deterministic PRNG so the projection doesn't jump around between renders.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const kFmt = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1000)}k`);

function Slider({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: React.ReactNode;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] text-muted-foreground">
        {label} <b className="text-base font-semibold text-foreground">{display}</b>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-offset-[6px] [&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(0,0,0,.5)] [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110"
        style={{ background: `linear-gradient(to right, var(--primary) ${fill}%, var(--secondary) ${fill}%)` }}
      />
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

export default function SimulatorPage() {
  const [mode, setMode] = useState<"hist" | "proj">("hist");
  const [inst, setInst] = useState("SPY");
  const [amount, setAmount] = useState(500);
  const [years, setYears] = useState(10);
  const [fee, setFee] = useState(1);
  const [ret, setRet] = useState(7);
  const [inflation, setInflation] = useState(false);
  const [terByInst, setTerByInst] = useState<Record<string, number>>({});
  const [country, setCountry] = useState("CH");

  const { data: portfolio } = usePortfolio();
  const own = (portfolio?.positions ?? []).map((p) => p.ticker.toUpperCase()).filter((t) => !INDEXES.some((i) => i.t === t));
  const instruments = [...INDEXES, ...own.map((t) => ({ t, name: t, ter: 0 }))];
  const current = instruments.find((i) => i.t === inst);
  const name = current?.name ?? inst;
  const defaultTer = current?.ter ?? 0;
  const ter = terByInst[inst] ?? defaultTer;

  const { data, isPending } = useMonthlyHistory(inst);
  const points = useMemo(() => data?.points ?? [], [data]);
  const taxRate = TAX.find((t) => t.k === country)!.rate;
  const maxYears = mode === "hist" ? 15 : 40;
  const yrs = Math.min(years, maxYears);

  const result = useMemo(() => {
    if (points.length < 13) return null;
    const lr = points.slice(1).map((p, i) => Math.log(p.close / points[i].close));
    const sigma = stdev(lr);
    const histCagr = Math.pow(points[points.length - 1].close / points[0].close, 12 / (points.length - 1)) - 1;

    if (mode === "hist") {
      const months = Math.min(yrs * 12, points.length - 1);
      const seg = points.slice(-(months + 1));
      let shares = 0;
      let invested = 0;
      const value: number[] = [];
      const inv: number[] = [];
      seg.forEach((p, i) => {
        if (i < seg.length - 1) {
          shares += Math.max(0, amount - fee) / p.close;
          invested += amount;
        }
        value.push(shares * p.close);
        inv.push(invested);
      });
      const final = value[value.length - 1];
      const lump = ((invested - fee) / seg[0].close) * seg[seg.length - 1].close;
      return { kind: "hist" as const, labels: seg.map((p) => p.month), value, inv, final, invested, lump, months, sigma, histCagr };
    }

    const months = yrs * 12;
    const paths = 700;
    const rnd = mulberry32(42);
    const mu = Math.log(1 + ret / 100) / 12 - (sigma * sigma) / 2;
    const infl = inflation ? Math.pow(1.02, 1 / 12) : 1;
    // The fund deducts its TER from the value continuously: a monthly drag.
    const terDrag = 1 - ter / 100 / 12;
    const per: number[][] = Array.from({ length: months + 1 }, () => []);
    const finalsNoTer: number[] = [];
    for (let k = 0; k < paths; k++) {
      let v = 0;
      let vNoTer = 0;
      per[0].push(0);
      for (let m = 1; m <= months; m++) {
        const z = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
        const growth = Math.exp(mu + sigma * z);
        v = (v + Math.max(0, amount - fee)) * growth * terDrag;
        vNoTer = (vNoTer + Math.max(0, amount - fee)) * growth;
        per[m].push(v / Math.pow(infl, m));
      }
      finalsNoTer.push(vNoTer / Math.pow(infl, months));
    }
    const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
    const p10 = per.map((a) => q(a, 0.1));
    const p50 = per.map((a) => q(a, 0.5));
    const p90 = per.map((a) => q(a, 0.9));
    const terCost = q(finalsNoTer, 0.5) - p50[p50.length - 1];
    const start = new Date().toISOString().slice(0, 7);
    return {
      kind: "proj" as const,
      labels: per.map((_, m) => addMonths(start, m)),
      p10,
      p50,
      p90,
      inv: per.map((_, m) => amount * m),
      months,
      sigma,
      histCagr,
      terCost,
    };
  }, [points, mode, yrs, amount, fee, ret, inflation, ter]);

  const pill = (on: boolean) =>
    cn(
      "rounded-[10px] border px-3 py-1.5 text-[13px] font-semibold transition-all",
      on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-secondary text-muted-foreground hover:text-foreground",
    );

  return (
    <Shell>
      <Topbar title="Investment plan simulator" subtitle="How a monthly investment plan grows: on real historical data or as a projection." />

      <div className="flex flex-col gap-6 px-6 pb-6 pt-4">
        <div className="animate-rise flex w-fit gap-0.5 rounded-full border border-border bg-card p-[3px]">
          {(
            [
              ["hist", "Historical"],
              ["proj", "Projection"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
                mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-[18px] max-[820px]:grid-cols-1">
          <div className="animate-rise flex flex-col gap-[18px] rounded-[22px] border border-border bg-card p-[18px]" style={{ "--i": 1 } as React.CSSProperties}>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-muted-foreground">Invest in</span>
              <div className="flex flex-wrap gap-1.5">
                {instruments.map((i) => (
                  <button key={i.t} type="button" onClick={() => setInst(i.t)} className={pill(i.t === inst)}>
                    {i.name}
                  </button>
                ))}
              </div>
            </div>
            <Slider id="amt" label="Monthly contribution" value={amount} display={usd(amount, 0)} min={50} max={3000} step={50} onChange={setAmount} />
            <Slider id="yrs" label="Duration" value={yrs} display={`${yrs} ${yrs === 1 ? "year" : "years"}`} min={1} max={maxYears} step={1} onChange={setYears} />
            {mode === "proj" && (
              <Slider
                id="ret"
                label="Expected annual return"
                value={ret}
                display={pct(ret / 100, 1, false)}
                min={0}
                max={15}
                step={0.5}
                onChange={setRet}
                hint={
                  result && (
                    <>
                      {name} returned {pct(result.histCagr, 1, false)} a year since {points[0]?.month.slice(0, 4)}.
                      {result.histCagr > 0.15 && " Repeating a return like that for years is unlikely."}
                    </>
                  )
                }
              />
            )}
            {mode === "proj" ? (
              <Slider
                id="ter"
                label="Annual fund fee (TER)"
                value={ter}
                display={`${ter.toFixed(2)}%`}
                min={0}
                max={1.5}
                step={0.01}
                onChange={(v) => setTerByInst((m) => ({ ...m, [inst]: v }))}
                hint={defaultTer ? `${name} ETF charges ${defaultTer.toFixed(2)}% a year.` : "Single stocks have no fund fee."}
              />
            ) : (
              defaultTer > 0 && (
                <p className="text-xs text-faint">
                  The {name} ETF charges a {defaultTer.toFixed(2)}% annual fee (TER). It is already reflected in the historical prices, so it is not deducted again here.
                </p>
              )
            )}
            <Slider id="fee" label="Fee per contribution" value={fee} display={usd(fee, fee % 1 ? 2 : 0)} min={0} max={10} step={0.5} onChange={setFee} />
            {mode === "proj" && <Toggle checked={inflation} onChange={setInflation} label="Adjust for inflation (2%)" />}
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-muted-foreground">Tax on the gain</span>
              <div className="flex flex-wrap gap-1.5">
                {TAX.map((t) => (
                  <button key={t.k} type="button" onClick={() => setCountry(t.k)} className={pill(t.k === country)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="animate-rise flex min-w-0 flex-col gap-3.5" style={{ "--i": 2 } as React.CSSProperties}>
            {!result ? (
              <Skeleton className="h-[460px] w-full rounded-[22px]" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5 rounded-[22px] border border-border bg-card p-[18px] max-sm:grid-cols-2">
                  {(result.kind === "hist"
                    ? [
                        ["Final value", result.final, false],
                        ["Invested", result.invested, false],
                        ["Gain", result.final - result.invested, true],
                      ]
                    : [
                        ["Median scenario", result.p50[result.p50.length - 1], false],
                        ["Pessimistic (10%)", result.p10[result.p10.length - 1], false],
                        ["Optimistic (90%)", result.p90[result.p90.length - 1], false],
                      ]
                  ).map(([k, v, signed], i) => (
                    <div key={k as string} className={cn(i === 0 && "max-sm:col-span-2")}>
                      <div className="text-[12.5px] text-muted-foreground">{k as string}</div>
                      <CountUp
                        value={v as number}
                        duration={600}
                        format={(x) => (signed ? signedUsd(x, 0) : usd(x, 0))}
                        className={cn(
                          "font-semibold tracking-tight",
                          i === 0 ? "text-[34px]" : "text-[22px]",
                          signed && toneClass(v as number),
                        )}
                      />
                    </div>
                  ))}
                </div>

                <div className="rounded-[22px] border border-border bg-card px-3.5 pb-2.5 pt-3.5">
                  {isPending ? (
                    <Skeleton className="h-[300px] w-full rounded-2xl" />
                  ) : (
                    <LineChart
                      key={`${mode}-${inst}`}
                      ariaLabel="Investment plan growth"
                      height={300}
                      labels={result.labels}
                      yFormat={kFmt}
                      band={result.kind === "proj" ? { lo: result.p10, hi: result.p90, color: "var(--primary)" } : undefined}
                      series={[
                        { values: result.kind === "hist" ? result.value : result.p50, color: "var(--primary)", area: result.kind === "hist", width: 2.4 },
                        { values: result.inv, color: "var(--muted-foreground)", dashed: true, width: 1.6 },
                      ]}
                    />
                  )}
                  <div className="mt-1 flex flex-wrap gap-3.5 text-[12.5px] text-muted-foreground">
                    <span><i className="mr-1.5 inline-block h-[3px] w-3.5 rounded bg-primary align-middle" />{result.kind === "hist" ? "Plan value" : "Median scenario"}</span>
                    {result.kind === "proj" && <span><i className="mr-1.5 inline-block h-[3px] w-3.5 rounded bg-primary/35 align-middle" />10th–90th percentile range</span>}
                    <span><i className="mr-1.5 inline-block h-[3px] w-3.5 rounded bg-muted-foreground align-middle" />Total invested</span>
                  </div>
                </div>

                <p
                  className={cn(
                    "rounded-2xl px-3.5 py-3 text-sm leading-relaxed [&_b]:text-foreground",
                    result.kind === "proj" && result.histCagr > 0.15 ? "bg-warn/10 text-[#e9cf9b]" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {result.kind === "hist" ? (
                    <>
                      Investing {usd(amount, 0)} a month in <b>{name}</b> since {fmtDate(result.labels[0])}, you would have <b>{usd(result.final, 0)}</b> today from {usd(result.invested, 0)} invested
                      {taxRate > 0 && `, ${usd(result.final - Math.max(0, result.final - result.invested) * taxRate, 0)} after tax`}. Investing the whole amount up front would have given you{" "}
                      <b>{usd(result.lump, 0)}</b>: {result.lump > result.final ? "more than the monthly plan, because the market rose most of the time" : "less than the monthly plan, because you also bought the dips"}.
                      {result.months < yrs * 12 && ` Data only available for ${Math.floor(result.months / 12)} years.`}
                    </>
                  ) : (
                    <>
                      {usd(amount, 0)} a month for {yrs} years in <b>{name}</b>: you put in {usd(amount * result.months, 0)} and the median scenario ends at{" "}
                      <b>{usd(result.p50[result.p50.length - 1], 0)}</b>
                      {inflation ? " in today's purchasing power" : ""}
                      {taxRate > 0 && `, about ${usd(result.p50[result.p50.length - 1] - Math.max(0, result.p50[result.p50.length - 1] - amount * result.months) * taxRate, 0)} after tax`}
                      . The range uses the historical volatility of {name} ({pct(result.sigma * Math.sqrt(12), 0, false)} a year) and an expected return of {pct(ret / 100, 1, false)}.
                      {ter > 0 && result.terCost > 0 && <> The {ter.toFixed(2)}% TER costs you about <b>{usd(result.terCost, 0)}</b> over the period.</>}
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
