import type { Fundamentals } from "@/lib/api/types";
import {
  fmtCompactUsd,
  fmtMetric,
  fmtMultiple,
  fmtNumber,
  fmtPercent,
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
        "flex min-h-[168px] flex-col rounded-[22px] border border-border bg-card p-[18px]",
        className,
      )}
    >
      {title && (
        <h3 className="mb-2 text-[13px] font-medium text-muted-foreground">
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
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-2.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-[15px] font-semibold tabular-nums text-foreground", valueClassName)}>
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
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-2.5 last:border-b-0">
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

export function ReportMetricCards({ fundamentals }: { fundamentals?: Fundamentals }) {
  const trailingPe = fundamentals?.trailing_pe ?? fundamentals?.pe_ttm;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

        <FintechCard title="Valutazione">
          <MetricRow
            label="P/E atteso"
            value={fmtMetric(fmtMultiple(fundamentals?.forward_pe))}
          />
          <MetricRow
            label="P/E attuale"
            value={fmtMetric(fmtMultiple(trailingPe))}
          />
          <MetricRow label="PEG Ratio" value={fmtMetric(fmtMultiple(fundamentals?.peg_ratio))} />
          <MetricRow label="EV/EBITDA" value={fmtMetric(fmtMultiple(fundamentals?.ev_ebitda))} />
        </FintechCard>

        <FintechCard title="Crescita">
          <MetricRow
            label="Ricavi su anno"
            value={fmtMetric(fmtPercent(fundamentals?.revenue_growth_yoy, { signed: true }))}
            valueClassName={signedColor(fundamentals?.revenue_growth_yoy)}
          />
          <MetricRow
            label="Utile per azione su anno"
            value={fmtMetric(fmtPercent(fundamentals?.eps_growth_yoy, { signed: true }))}
            valueClassName={signedColor(fundamentals?.eps_growth_yoy)}
          />
          <MetricRow
            label="Ricavi attesi"
            value={fmtMetric(fmtPercent(fundamentals?.revenue_forward, { signed: true }))}
            valueClassName={signedColor(fundamentals?.revenue_forward)}
          />
        </FintechCard>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FintechCard title="Redditività">
        <MetricRow
          label="Margine lordo"
          value={fmtMetric(fmtPercent(fundamentals?.gross_margin))}
        />
        <MetricRow
          label="Margine operativo"
          value={fmtMetric(fmtPercent(fundamentals?.operating_margin))}
        />
        <MetricRow label="Margine netto" value={fmtMetric(fmtPercent(fundamentals?.net_margin))} />
      </FintechCard>

      <FintechCard title="Solidità finanziaria">
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

      <FintechCard title="Conti (ultimi 12 mesi)">
        <FinancialRow
          label="Ricavi"
          amount={fundamentals?.revenue_ttm}
          yoy={fundamentals?.revenue_yoy ?? fundamentals?.revenue_growth_yoy}
        />
        <FinancialRow label="EBITDA" amount={fundamentals?.ebitda_ttm} yoy={fundamentals?.ebitda_yoy} />
        <FinancialRow
          label="Utile netto"
          amount={fundamentals?.net_income_ttm}
          yoy={fundamentals?.net_income_yoy}
        />
      </FintechCard>
      </div>
    </div>
  );
}
