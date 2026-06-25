import type { Fundamentals, PriceStats } from "@/lib/api/types";
import {
  fmtCompactUsd,
  fmtMetric,
  fmtMultiple,
  fmtNumber,
  fmtPercent,
  fmtPrice,
  signedColor,
} from "@/lib/format";
import { cn } from "@/lib/utils";

function FintechCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[168px] flex-col rounded-2xl border border-white/[0.06] bg-card/90 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      {title && (
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
          {title}
        </h3>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function MetricRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

function FinancialRow({
  label,
  amount,
  yoy,
}: {
  label: string;
  amount: number | null | undefined;
  yoy: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-medium tabular-nums text-foreground">
          {fmtMetric(fmtCompactUsd(amount))}
        </span>
        <span className={cn("min-w-[3.5rem] text-right text-xs tabular-nums", signedColor(yoy))}>
          {yoy != null && !Number.isNaN(yoy) ? fmtPercent(yoy, { signed: true }) : "N/A"}
        </span>
      </div>
    </div>
  );
}

function PriceCard({ priceStats }: { priceStats?: PriceStats }) {
  const price = priceStats?.last_price;
  const return1y = priceStats?.return_1y;
  const low52 = priceStats?.low_52w;
  const high52 = priceStats?.high_52w;

  return (
    <FintechCard className="justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
          Price
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-foreground">
          {fmtMetric(fmtPrice(price))}
        </p>
        {return1y != null && !Number.isNaN(return1y) ? (
          <p className={cn("mt-2 text-sm tabular-nums", signedColor(return1y))}>
            ({fmtPercent(return1y, { signed: true })} 1Y)
          </p>
        ) : (
          <p className="mt-2 text-sm tabular-nums text-muted-foreground">(N/A 1Y)</p>
        )}
      </div>
      <p className="mt-4 text-xs tabular-nums text-muted-foreground/70">
        52W: {fmtMetric(fmtPrice(low52))} — {fmtMetric(fmtPrice(high52))}
      </p>
    </FintechCard>
  );
}

export function ReportMetricCards({
  fundamentals,
  priceStats,
}: {
  fundamentals?: Fundamentals;
  priceStats?: PriceStats;
}) {
  const trailingPe = fundamentals?.trailing_pe ?? fundamentals?.pe_ttm;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <PriceCard priceStats={priceStats} />

      <FintechCard title="Valuation">
        <MetricRow
          label="Forward P/E"
          value={fmtMetric(fmtMultiple(fundamentals?.forward_pe))}
        />
        <MetricRow
          label="Trailing P/E"
          value={fmtMetric(fmtMultiple(trailingPe))}
        />
        <MetricRow label="PEG Ratio" value={fmtMetric(fmtMultiple(fundamentals?.peg_ratio))} />
        <MetricRow label="EV/EBITDA" value={fmtMetric(fmtMultiple(fundamentals?.ev_ebitda))} />
      </FintechCard>

      <FintechCard title="Growth">
        <MetricRow
          label="Revenue YoY"
          value={fmtMetric(fmtPercent(fundamentals?.revenue_growth_yoy, { signed: true }))}
          valueClassName={signedColor(fundamentals?.revenue_growth_yoy)}
        />
        <MetricRow
          label="EPS YoY"
          value={fmtMetric(fmtPercent(fundamentals?.eps_growth_yoy, { signed: true }))}
          valueClassName={signedColor(fundamentals?.eps_growth_yoy)}
        />
        <MetricRow
          label="Revenue Forward"
          value={fmtMetric(fmtPercent(fundamentals?.revenue_forward, { signed: true }))}
          valueClassName={signedColor(fundamentals?.revenue_forward)}
        />
      </FintechCard>

      <FintechCard title="Profitability">
        <MetricRow
          label="Gross Margin"
          value={fmtMetric(fmtPercent(fundamentals?.gross_margin))}
        />
        <MetricRow
          label="Operating Margin"
          value={fmtMetric(fmtPercent(fundamentals?.operating_margin))}
        />
        <MetricRow label="Net Margin" value={fmtMetric(fmtPercent(fundamentals?.net_margin))} />
      </FintechCard>

      <FintechCard title="Financial Health">
        <MetricRow
          label="Debt/Equity"
          value={fmtMetric(fmtNumber(fundamentals?.debt_to_equity, 2))}
        />
        <MetricRow
          label="Current Ratio"
          value={fmtMetric(fmtNumber(fundamentals?.current_ratio, 2))}
        />
        <MetricRow
          label="FCF Yield"
          value={fmtMetric(fmtPercent(fundamentals?.fcf_yield))}
        />
      </FintechCard>

      <FintechCard title="Financials (TTM)">
        <FinancialRow
          label="Revenue"
          amount={fundamentals?.revenue_ttm}
          yoy={fundamentals?.revenue_yoy ?? fundamentals?.revenue_growth_yoy}
        />
        <FinancialRow label="EBITDA" amount={fundamentals?.ebitda_ttm} yoy={fundamentals?.ebitda_yoy} />
        <FinancialRow
          label="Net Income"
          amount={fundamentals?.net_income_ttm}
          yoy={fundamentals?.net_income_yoy}
        />
      </FintechCard>
    </div>
  );
}
