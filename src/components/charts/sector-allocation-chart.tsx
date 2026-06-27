"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { Holding } from "@/lib/api/types";
import { fmtCurrency, fmtPercent } from "@/lib/format";

const SECTOR_COLORS = [
  "#3b82f6",
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#fb7185",
  "#818cf8",
  "#38bdf8",
  "#e879f9",
];

type SectorSlice = {
  name: string;
  value: number;
  pct: number;
  color: string;
};

function groupBySector(positions: Holding[]): SectorSlice[] {
  const totals = new Map<string, number>();

  for (const position of positions) {
    const sector = position.sector?.trim() || "Unknown";
    totals.set(sector, (totals.get(sector) ?? 0) + (position.market_value ?? 0));
  }

  const portfolioValue = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(totals.entries())
    .map(([name, value], index) => ({
      name,
      value,
      pct: portfolioValue > 0 ? value / portfolioValue : 0,
      color: SECTOR_COLORS[index % SECTOR_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

function SectorTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SectorSlice }[];
}) {
  if (!active || !payload?.length) return null;

  const slice = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1424] px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-medium text-white">{slice.name}</p>
      <p className="mt-1.5 tabular-nums text-muted-foreground">
        {fmtCurrency(slice.value)} · {fmtPercent(slice.pct)}
      </p>
    </div>
  );
}

export function SectorAllocationChart({ positions }: { positions: Holding[] }) {
  const data = useMemo(() => groupBySector(positions), [positions]);
  const totalValue = useMemo(
    () => data.reduce((sum, slice) => sum + slice.value, 0),
    [data],
  );
  const hasValue = data.some((slice) => slice.value > 0);

  if (positions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No positions to display</p>
    );
  }

  if (!hasValue) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Market values unavailable for sector allocation
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
      <div className="relative mx-auto h-[260px] w-full max-w-[260px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="transparent"
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<SectorTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Total value
          </span>
          <span className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-white">
            {fmtCurrency(totalValue, { compact: true })}
          </span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-3">
        {data.map((slice) => (
          <li
            key={slice.name}
            className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-sm text-foreground">{slice.name}</span>
            </div>
            <div className="flex shrink-0 items-baseline gap-4 tabular-nums">
              <span className="text-sm text-muted-foreground">{fmtCurrency(slice.value)}</span>
              <span className="w-12 text-right text-sm font-medium text-foreground">
                {fmtPercent(slice.pct, { digits: 1 })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
