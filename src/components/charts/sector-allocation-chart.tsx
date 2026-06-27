"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { Holding } from "@/lib/api/types";
import { fmtCurrency, fmtPercent } from "@/lib/format";

const SECTOR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--up)",
  "#e0894a",
  "#a78bfa",
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
    <div className="rounded-lg border border-white/[0.08] bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{slice.name}</p>
      <p className="mt-1 tabular-nums text-muted-foreground">
        {fmtCurrency(slice.value)} · {fmtPercent(slice.pct)}
      </p>
    </div>
  );
}

export function SectorAllocationChart({ positions }: { positions: Holding[] }) {
  const data = useMemo(() => groupBySector(positions), [positions]);
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
      <div className="mx-auto h-[240px] w-full max-w-[280px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
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
      </div>

      <ul className="grid flex-1 grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full ring-2 ring-white/[0.06]"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-muted-foreground">{slice.name}</span>
            </div>
            <span className="shrink-0 tabular-nums text-foreground">
              {fmtPercent(slice.pct, { digits: 1 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
