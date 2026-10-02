"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { daysUntil, fmtDate, pct, signedUsd, toneClass, usd } from "./fmt";
import type { Pos } from "./model";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="w-[92px] max-sm:hidden" />;
  const W = 92;
  const H = 34;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${(H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6)).toFixed(1)}`)
    .join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[34px] w-[92px] max-sm:hidden" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "var(--up)" : "var(--down)"}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        className="anim-draw"
      />
    </svg>
  );
}

function Kv({ k, children, className }: { k: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-[15px] font-semibold">{children}</div>
    </div>
  );
}

function Row({ p, onRemove }: { p: Pos; onRemove: (ticker: string) => void }) {
  const [open, setOpen] = useState(false);
  const ins = p.ins;
  const spark = ins?.spark?.length ? [...ins.spark.slice(0, -1), p.price] : [];
  const a = ins?.analysts;
  const total = a ? a.strongBuy + a.buy + a.hold + a.sell + a.strongSell : 0;
  const buy = a && total ? (a.strongBuy + a.buy) / total : 0;
  const hold = a && total ? a.hold / total : 0;
  const sell = a && total ? (a.sell + a.strongSell) / total : 0;
  const upside = ins?.target_mean ? ins.target_mean / p.price - 1 : null;
  const range =
    ins?.high_52w && ins?.low_52w
      ? Math.max(0, Math.min(1, (p.price - ins.low_52w) / (ins.high_52w - ins.low_52w)))
      : null;
  const earn = ins?.next_earnings?.date;

  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[44px_minmax(0,1fr)_92px_auto] items-center gap-3.5 rounded-2xl px-1 py-3.5 text-left transition-colors hover:bg-white/[0.025] max-sm:grid-cols-[40px_minmax(0,1fr)_auto]"
      >
        <span className="grid size-11 place-items-center overflow-hidden rounded-[13px] bg-secondary text-sm font-bold tracking-tight max-sm:size-10">
          {ins?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ins.logo} alt="" className="size-full bg-white object-cover" />
          ) : (
            p.ticker
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{p.ticker}</span>
          <span className="block truncate text-[13px] text-muted-foreground">
            {p.shares} shares · {pct(p.weight, 1, false)} of portfolio
          </span>
        </span>
        <Sparkline values={spark} />
        <span className="text-right">
          <span className="block font-semibold">{usd(p.value)}</span>
          <span className={cn("block text-[13px] font-semibold", toneClass(p.dayPct))}>
            {p.dayPct >= 0 ? "▲" : "▼"} {pct(p.dayPct, 2)}
          </span>
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-4 gap-x-[18px] gap-y-3.5 pb-[18px] pl-[62px] pr-1 pt-1 max-md:grid-cols-2 max-md:pl-1">
            <Kv k="Unrealized gain">
              <span className={toneClass(p.gain)}>{signedUsd(p.gain)}</span>{" "}
              <small className="text-xs font-medium text-muted-foreground">{pct(p.value / p.cost - 1)}</small>
            </Kv>
            <Kv k="Avg cost → price">
              {usd(p.avg)} → {usd(p.price)}
            </Kv>
            <Kv k="P/E trailing · forward">
              {ins?.pe ? ins.pe.toFixed(1) : "—"}{" "}
              <small className="text-xs font-medium text-muted-foreground">· {ins?.forward_pe ? ins.forward_pe.toFixed(1) : "—"}</small>
            </Kv>
            <Kv k="Next earnings">
              {earn ? fmtDate(earn) : "—"}{" "}
              {earn && <small className="text-xs font-medium text-muted-foreground">in {daysUntil(earn)} days</small>}
            </Kv>
            {a && total ? (
              <div className="col-span-2 min-w-0">
                <div className="text-xs text-muted-foreground">
                  Analysts ({total}): {Math.round(buy * 100)}% buy · {Math.round(hold * 100)}% hold ·{" "}
                  {Math.round(sell * 100)}% sell
                </div>
                <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                  <span className="bg-up" style={{ flexGrow: buy }} />
                  <span className="bg-faint" style={{ flexGrow: hold }} />
                  <span className="bg-down" style={{ flexGrow: sell }} />
                </div>
              </div>
            ) : (
              <Kv k="Analysts" className="col-span-2">
                <small className="text-xs font-medium text-muted-foreground">not applicable to ETFs</small>
              </Kv>
            )}
            <Kv k="Avg price target">
              {ins?.target_mean ? usd(ins.target_mean) : "—"}{" "}
              {upside != null && <small className={cn("text-xs font-semibold", toneClass(upside))}>{pct(upside)}</small>}
            </Kv>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">52-week low · high</div>
              {range != null ? (
                <>
                  <div className="relative mt-2.5 h-1.5 rounded-full bg-secondary">
                    <i
                      className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground"
                      style={{ left: `${range * 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between font-mono text-[11px] text-faint">
                    <span>{usd(ins!.low_52w!, 0)}</span>
                    <span>{usd(ins!.high_52w!, 0)}</span>
                  </div>
                </>
              ) : (
                "—"
              )}
            </div>
            <div className="col-span-full flex flex-wrap items-center gap-4">
              {p.sector !== "ETF" && (
                <Link href={`/?ticker=${p.ticker}`} className="text-[13px] font-semibold text-primary hover:underline">
                  Open the {p.ticker} research report →
                </Link>
              )}
              <button
                type="button"
                onClick={() => onRemove(p.ticker)}
                className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-down"
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Holdings({ positions, onRemove }: { positions: Pos[]; onRemove: (ticker: string) => void }) {
  const gainers = positions.filter((p) => p.gain > 0);
  const losers = positions.filter((p) => p.gain < 0);
  const sorted = [...positions].sort((a, b) => b.value - a.value);
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-2">
        <Chip k="In profit" v={signedUsd(gainers.reduce((s, p) => s + p.gain, 0), 0)} tone="text-up" n={`${gainers.length} positions`} />
        <Chip
          k="At a loss"
          v={signedUsd(losers.reduce((s, p) => s + p.gain, 0), 0)}
          tone={losers.length ? "text-down" : ""}
          n={`${losers.length} positions`}
        />
        <Chip k="Realized this year" v="$0" n="no sales recorded" className="max-sm:col-span-2" />
      </div>
      <div className="rounded-[22px] border border-border bg-card px-3.5 py-1.5">
        {sorted.map((p) => (
          <Row key={p.ticker} p={p} onRemove={onRemove} />
        ))}
      </div>
    </>
  );
}

function Chip({ k, v, n, tone, className }: { k: string; v: string; n: string; tone?: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 rounded-2xl border border-border bg-card px-3.5 py-3", className)}>
      <span className="text-[12.5px] text-muted-foreground">{k}</span>
      <span className={cn("text-lg font-semibold tracking-tight", tone)}>{v}</span>
      <span className="text-xs text-faint">{n}</span>
    </div>
  );
}
