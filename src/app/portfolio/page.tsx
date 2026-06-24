import { DataCard } from "@/components/data/data-card";
import { DataTable, type Column } from "@/components/data/data-table";
import { Delta } from "@/components/data/delta";
import { MetricStat } from "@/components/data/metric-stat";
import { RiskBar } from "@/components/data/risk-bar";
import { SectionLabel } from "@/components/data/section-label";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { demoPortfolioPositions, demoPortfolioTotals, demoRisk } from "@/lib/demo";
import { fmtCurrency, fmtPercent, fmtPrice } from "@/lib/format";
import type { Holding } from "@/lib/api/types";

const positionColumns: Column<Holding>[] = [
  {
    key: "ticker",
    header: "Ticker",
    cell: (h) => <span className="font-medium text-foreground">{h.ticker}</span>,
  },
  {
    key: "shares",
    header: "Shares",
    align: "right",
    cell: (h) => <span className="tabular-nums text-muted-foreground">{h.shares}</span>,
  },
  {
    key: "avg",
    header: "Avg cost",
    align: "right",
    cell: (h) => <span className="tabular-nums">{fmtPrice(h.avg_cost_price)}</span>,
  },
  {
    key: "price",
    header: "Price",
    align: "right",
    cell: (h) => <span className="tabular-nums">{fmtPrice(h.current_price)}</span>,
  },
  {
    key: "value",
    header: "Mkt value",
    align: "right",
    cell: (h) => <span className="tabular-nums">{fmtCurrency(h.market_value)}</span>,
  },
  {
    key: "weight",
    header: "Weight",
    align: "right",
    cell: (h) => <span className="tabular-nums text-muted-foreground">{fmtPercent(h.weight)}</span>,
  },
  {
    key: "pnl",
    header: "P&L",
    align: "right",
    cell: (h) => (
      <div className="flex flex-col items-end">
        <span className={`tabular-nums ${(h.pnl ?? 0) >= 0 ? "text-up" : "text-down"}`}>
          {fmtCurrency(h.pnl)}
        </span>
        <Delta value={h.pnl_pct} />
      </div>
    ),
  },
];

export default function PortfolioPage() {
  return (
    <Shell>
      <Topbar title="Portfolio analysis" demo />

      <div className="flex flex-col gap-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DataCard>
            <MetricStat
              label="Valore totale"
              value={fmtCurrency(demoPortfolioTotals.value)}
              footnote={
                <span className="text-up">{fmtPercent(demoPortfolioTotals.pnlPct, { signed: true })} cost basis</span>
              }
            />
          </DataCard>
          <DataCard>
            <MetricStat
              label="Vol. annualizzata"
              value={fmtPercent(demoRisk.annualizedVol)}
              footnote="portafoglio"
            />
          </DataCard>
          <DataCard>
            <MetricStat
              label="Scenario -20%"
              value={<span className="text-down">{fmtCurrency(demoRisk.scenarioCrash)}</span>}
              footnote="market crash"
            />
          </DataCard>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Posizioni</SectionLabel>
          <DataCard source="yfinance" contentClassName="px-2">
            <DataTable
              columns={positionColumns}
              rows={demoPortfolioPositions}
              getRowKey={(h) => h.ticker}
            />
          </DataCard>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Risk contribution per posizione</SectionLabel>
          <DataCard source="yfinance">
            <div className="flex flex-col gap-4">
              {demoRisk.contributions.map((c) => (
                <RiskBar key={c.ticker} label={c.ticker} pct={c.pct} color={c.color} />
              ))}
            </div>
          </DataCard>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Scenario analysis</SectionLabel>
          <DataCard>
            <div className="flex flex-col divide-y divide-border/60">
              {demoRisk.scenarios.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-sm">{s.label}</span>
                  <span className="text-sm tabular-nums text-down">{fmtCurrency(s.value)}</span>
                </div>
              ))}
            </div>
          </DataCard>
        </div>
      </div>
    </Shell>
  );
}
