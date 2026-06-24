import { AICard } from "@/components/data/ai-card";
import { DataCard } from "@/components/data/data-card";
import { DataTable, type Column } from "@/components/data/data-table";
import { MetricStat } from "@/components/data/metric-stat";
import { SectionLabel } from "@/components/data/section-label";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { demoResearch, type DemoInsider } from "@/lib/demo";
import { fmtMultiple, fmtPercent, fmtPrice } from "@/lib/format";

const insiderColumns: Column<DemoInsider>[] = [
  {
    key: "name",
    header: "Insider",
    cell: (r) => (
      <span>
        <span className="font-medium text-foreground">{r.name}</span>
        <span className="text-muted-foreground"> — {r.role}</span>
      </span>
    ),
  },
  {
    key: "tx",
    header: "Transazione",
    align: "right",
    cell: (r) => (
      <Badge
        variant="outline"
        className={cn(
          r.action === "Buy"
            ? "border-up/30 bg-up/10 text-up"
            : "border-down/30 bg-down/10 text-down",
        )}
      >
        {r.action} {r.amount}
      </Badge>
    ),
  },
  {
    key: "date",
    header: "Data",
    align: "right",
    cell: (r) => <span className="text-muted-foreground">{r.date}</span>,
  },
];

export default function ResearchReportPage() {
  return (
    <Shell>
      <Topbar title="Research report" demo />

      <div className="flex flex-col gap-5 p-6">
        <div>
          <Badge className="border-primary/30 bg-primary/15 text-[color:var(--accent-bright)]">
            {demoResearch.ticker} — {demoResearch.name}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DataCard>
            <MetricStat
              label="Price"
              value={fmtPrice(demoResearch.price)}
              footnote={
                <span className="text-up">{fmtPercent(demoResearch.priceChange, { signed: true })} oggi</span>
              }
            />
          </DataCard>
          <DataCard>
            <MetricStat
              label="P/E TTM"
              value={fmtMultiple(demoResearch.peTtm)}
              footnote={`vs settore ${fmtMultiple(demoResearch.peSector)}`}
            />
          </DataCard>
          <DataCard>
            <MetricStat
              label="Revenue growth"
              value={fmtPercent(demoResearch.revenueGrowth, { signed: true })}
              footnote="YoY"
            />
          </DataCard>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Insider activity — ultimi 90 giorni</SectionLabel>
          <DataCard source="SEC EDGAR" contentClassName="px-2">
            <DataTable
              columns={insiderColumns}
              rows={demoResearch.insider}
              getRowKey={(r) => r.name}
            />
          </DataCard>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>AI research note</SectionLabel>
          <AICard model="claude-sonnet-4-6">
            <p className="leading-relaxed">
              {demoResearch.aiNote}{" "}
              <span className="font-medium text-foreground">{demoResearch.aiOutlook}</span>
            </p>
          </AICard>
        </div>
      </div>
    </Shell>
  );
}
