"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { fmtDate } from "./fmt";

export type LineSeries = {
  values: (number | null)[];
  color: string;
  area?: boolean;
  dashed?: boolean;
  width?: number;
};

// Scrubbable line chart drawn in plain SVG. Lines draw themselves in on mount
// (pathLength trick); remount with a new `key` to replay the animation.
export function LineChart({
  series,
  labels,
  band,
  height = 280,
  yFormat = (v) => `$${Math.round(v).toLocaleString("en-US")}`,
  onScrub,
  ariaLabel,
}: {
  series: LineSeries[];
  labels: string[];
  band?: { lo: number[]; hi: number[]; color: string };
  height?: number;
  yFormat?: (v: number) => string;
  onScrub?: (index: number | null) => void;
  ariaLabel: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = labels.length;
  const padT = 14;
  const padB = 24;
  const W = width;
  const H = height;

  const { lo, hi } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of series) for (const v of s.values) if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (band) { for (const v of band.lo) lo = Math.min(lo, v); for (const v of band.hi) hi = Math.max(hi, v); }
    const span = hi - lo || 1;
    return { lo: lo - span * 0.06, hi: hi + span * 0.06 };
  }, [series, band]);

  if (n < 2) return <div style={{ height }} />;

  const x = (i: number) => (i / (n - 1)) * (W - 4) + 2;
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const path = (vals: (number | null)[]) => {
    let d = "";
    vals.forEach((v, i) => {
      if (v == null) return;
      d += `${d ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
    });
    return d;
  };

  const ticks = [1, 2, 3].map((t) => lo + ((hi - lo) * t) / 4);
  const first = series[0]?.values;
  const lastVal = first?.[n - 1];

  const handle = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const i = Math.max(0, Math.min(n - 1, Math.round(((clientX - r.left) / r.width) * (n - 1))));
    setHover(i);
    onScrub?.(i);
  };
  const leave = () => {
    setHover(null);
    onScrub?.(null);
  };

  return (
    <svg
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full touch-pan-y select-none"
      style={{ height }}
      onPointerMove={(e) => handle(e.clientX)}
      onPointerDown={(e) => handle(e.clientX)}
      onPointerLeave={leave}
    >
      <defs>
        {series.map((s, k) =>
          s.area ? (
            <linearGradient key={k} id={`g-${uid}-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="1" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ) : null,
        )}
      </defs>
      {[lo + (hi - lo) * 0, ...ticks, hi].map((v, t) => (
        <line key={t} x1={0} x2={W} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="2 4" />
      ))}
      {ticks.map((v, t) => (
        <text key={t} x={W - 2} y={y(v) - 5} textAnchor="end" className="fill-faint font-mono text-[11px]">
          {yFormat(v)}
        </text>
      ))}
      {[0, Math.floor((n - 1) / 2), n - 1].map((i, k) => (
        <text
          key={k}
          x={x(i)}
          y={H - 6}
          textAnchor={k === 0 ? "start" : k === 1 ? "middle" : "end"}
          className="fill-faint font-mono text-[11px]"
        >
          {fmtDate(labels[i])}
        </text>
      ))}
      {band && (
        <path
          className="anim-fade"
          d={`${band.hi.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join("")}${band.lo
            .map((v, i) => `L${x(i)} ${y(v)}`)
            .reverse()
            .join("")}Z`}
          fill={band.color}
          fillOpacity={0.16}
        />
      )}
      {series.map((s, k) => {
        const d = path(s.values);
        return (
          <g key={k}>
            {s.area && (
              <path className="anim-fade" d={`${d}L${x(n - 1)} ${H - padB}L${x(0)} ${H - padB}Z`} fill={`url(#g-${uid}-${k})`} />
            )}
            <path
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={s.dashed ? undefined : 1}
              strokeDasharray={s.dashed ? "4 5" : undefined}
              className={s.dashed ? "anim-fade" : "anim-draw"}
            />
          </g>
        );
      })}
      {lastVal != null && hover == null && (
        <circle cx={x(n - 1)} cy={y(lastVal)} r={4} fill={series[0].color} className="anim-fade">
          <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {hover != null && (
        <g>
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
          {series.map((s, k) =>
            s.values[hover] != null ? (
              <circle key={k} cx={x(hover)} cy={y(s.values[hover] as number)} r={5} fill={s.color} stroke="var(--background)" strokeWidth={2.5} />
            ) : null,
          )}
        </g>
      )}
    </svg>
  );
}
