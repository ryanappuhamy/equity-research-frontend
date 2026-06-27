import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { getRecentTransactions } from "@/components/data/insider-activity-table";
import type { Fundamentals, InsiderActivity, PriceStats, ReportResponse } from "@/lib/api/types";
import {
  fmtCompactUsd,
  fmtMetric,
  fmtMultiple,
  fmtNumber,
  fmtPercent,
  fmtPrice,
} from "@/lib/format";

const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type MetricRow = [category: string, metric: string, value: string];

function buildMetricRows(
  fundamentals?: Fundamentals,
  priceStats?: PriceStats,
): MetricRow[] {
  const trailingPe = fundamentals?.trailing_pe ?? fundamentals?.pe_ttm;
  const low52 = fmtMetric(fmtPrice(priceStats?.low_52w));
  const high52 = fmtMetric(fmtPrice(priceStats?.high_52w));

  return [
    ["Price", "Last price", fmtMetric(fmtPrice(priceStats?.last_price))],
    [
      "Price",
      "1Y return",
      priceStats?.return_1y != null
        ? fmtPercent(priceStats.return_1y, { signed: true })
        : "N/A",
    ],
    ["Price", "52-week range", `${low52} — ${high52}`],
    ["Valuation", "Forward P/E", fmtMetric(fmtMultiple(fundamentals?.forward_pe))],
    ["Valuation", "Trailing P/E", fmtMetric(fmtMultiple(trailingPe))],
    ["Valuation", "PEG Ratio", fmtMetric(fmtMultiple(fundamentals?.peg_ratio))],
    ["Valuation", "EV/EBITDA", fmtMetric(fmtMultiple(fundamentals?.ev_ebitda))],
    [
      "Growth",
      "Revenue YoY",
      fmtMetric(fmtPercent(fundamentals?.revenue_growth_yoy, { signed: true })),
    ],
    [
      "Growth",
      "EPS YoY",
      fmtMetric(fmtPercent(fundamentals?.eps_growth_yoy, { signed: true })),
    ],
    [
      "Growth",
      "Revenue Forward",
      fmtMetric(fmtPercent(fundamentals?.revenue_forward, { signed: true })),
    ],
    ["Profitability", "Gross Margin", fmtMetric(fmtPercent(fundamentals?.gross_margin))],
    [
      "Profitability",
      "Operating Margin",
      fmtMetric(fmtPercent(fundamentals?.operating_margin)),
    ],
    ["Profitability", "Net Margin", fmtMetric(fmtPercent(fundamentals?.net_margin))],
    [
      "Financial Health",
      "Debt/Equity",
      fmtMetric(fmtNumber(fundamentals?.debt_to_equity, 2)),
    ],
    [
      "Financial Health",
      "Current Ratio",
      fmtMetric(fmtNumber(fundamentals?.current_ratio, 2)),
    ],
    ["Financial Health", "FCF Yield", fmtMetric(fmtPercent(fundamentals?.fcf_yield))],
    ["Financials (TTM)", "Revenue", fmtMetric(fmtCompactUsd(fundamentals?.revenue_ttm))],
    [
      "Financials (TTM)",
      "Revenue YoY",
      fmtMetric(
        fmtPercent(fundamentals?.revenue_yoy ?? fundamentals?.revenue_growth_yoy, {
          signed: true,
        }),
      ),
    ],
    ["Financials (TTM)", "EBITDA", fmtMetric(fmtCompactUsd(fundamentals?.ebitda_ttm))],
    [
      "Financials (TTM)",
      "EBITDA YoY",
      fmtMetric(fmtPercent(fundamentals?.ebitda_yoy, { signed: true })),
    ],
    [
      "Financials (TTM)",
      "Net Income",
      fmtMetric(fmtCompactUsd(fundamentals?.net_income_ttm)),
    ],
    [
      "Financials (TTM)",
      "Net Income YoY",
      fmtMetric(fmtPercent(fundamentals?.net_income_yoy, { signed: true })),
    ],
  ];
}

function buildInsiderRows(activity?: InsiderActivity): string[][] {
  const filings = activity?.form4_filings_last_6m;
  const subtitle =
    filings != null
      ? `${filings} Form 4 filing${filings === 1 ? "" : "s"} in the last 6 months${
          activity?.most_recent_form4 ? ` · most recent ${activity.most_recent_form4}` : ""
        }`
      : "Insider activity summary unavailable";

  const transactions = getRecentTransactions(activity);
  if (transactions.length === 0) {
    return [[subtitle], ["No individual transactions available"]];
  }

  return [
    [subtitle],
    ...transactions.map((tx) => [
      `${tx.name}${tx.role ? ` (${tx.role})` : ""}`,
      `${tx.action} ${tx.amountLabel}`,
      tx.dateLabel,
    ]),
  ];
}

function getFinalY(doc: jsPDF, fallback: number): number {
  const withTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - MARGIN) return y;
  doc.addPage();
  return MARGIN;
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  let nextY = ensureSpace(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 40, 60);
  doc.text(title, MARGIN, nextY);
  return nextY + 6;
}

function addBodyText(doc: jsPDF, y: number, text: string, fontSize = 10): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(40, 40, 40);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
  let nextY = y;

  for (const line of lines) {
    nextY = ensureSpace(doc, nextY, 6);
    doc.text(line, MARGIN, nextY);
    nextY += fontSize * 0.45 + 2;
  }

  return nextY + 4;
}

export function downloadResearchReportPdf(
  report: ReportResponse,
  companyName: string,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const fundamentals = report.data.fundamentals;
  const priceStats = report.data.price_stats;
  const insider = report.data.insider_activity;

  let y = MARGIN + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 30, 50);
  doc.text(`${report.ticker} — ${companyName}`, MARGIN, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Research report · ${new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date())}`,
    MARGIN,
    y,
  );

  y += 10;
  y = addSectionTitle(doc, y, "Key metrics");

  autoTable(doc, {
    startY: y,
    head: [["Category", "Metric", "Value"]],
    body: buildMetricRows(fundamentals, priceStats),
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: [30, 40, 60],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      textColor: [35, 35, 35],
      lineColor: [220, 225, 230],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 52 },
      2: { halign: "right" },
    },
  });

  y = getFinalY(doc, y) + 10;
  y = addSectionTitle(doc, y, "Insider activity");

  const insiderRows = buildInsiderRows(insider);
  const insiderSubtitle = insiderRows[0][0];
  y = addBodyText(doc, y, insiderSubtitle, 9);

  if (insiderRows.length > 1) {
    autoTable(doc, {
      startY: y,
      head: [["Insider", "Transaction", "Date"]],
      body: insiderRows.slice(1),
      theme: "grid",
      margin: { left: MARGIN, right: MARGIN },
      headStyles: {
        fillColor: [30, 40, 60],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
        textColor: [35, 35, 35],
        lineColor: [220, 225, 230],
        lineWidth: 0.1,
      },
      columnStyles: {
        2: { halign: "right", cellWidth: 24 },
      },
    });
    y = getFinalY(doc, y) + 10;
  } else {
    y += 4;
  }

  y = addSectionTitle(doc, y, "AI research note");
  addBodyText(doc, y, report.report || "No research note available.");

  doc.save(`${report.ticker}-research-report.pdf`);
}
