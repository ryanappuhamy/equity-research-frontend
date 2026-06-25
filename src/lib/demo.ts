// Placeholder data for the design showcase only. NOT real research output.
// The Dashboard renders this so the UI is visible before a live portfolio
// exists (and instantly, without waiting on the Render cold start). Swap any
// of these for the live React Query hooks in lib/api/hooks.ts.

import type { Holding, TriggeredAlert } from "./api/types";

export const DEMO = true;

export const demoHoldings: Holding[] = [
  { ticker: "NVDA", shares: 40, avg_cost_price: 88.4, current_price: 121.3, market_value: 4852, cost_basis: 3536, pnl: 1316, pnl_pct: 0.372, weight: 0.31 },
  { ticker: "MSFT", shares: 12, avg_cost_price: 372.1, current_price: 441.0, market_value: 5292, cost_basis: 4465, pnl: 827, pnl_pct: 0.185, weight: 0.34 },
  { ticker: "AAPL", shares: 18, avg_cost_price: 191.2, current_price: 207.5, market_value: 3735, cost_basis: 3442, pnl: 293, pnl_pct: 0.085, weight: 0.24 },
  { ticker: "AMD", shares: 14, avg_cost_price: 142.0, current_price: 128.7, market_value: 1802, cost_basis: 1988, pnl: -186, pnl_pct: -0.094, weight: 0.11 },
];

export const demoEquityCurve: { date: string; value: number }[] = [
  { date: "Jan", value: 12640 },
  { date: "Feb", value: 12980 },
  { date: "Mar", value: 12410 },
  { date: "Apr", value: 13520 },
  { date: "May", value: 14180 },
  { date: "Jun", value: 13890 },
  { date: "Jul", value: 14760 },
  { date: "Aug", value: 15210 },
  { date: "Sep", value: 14980 },
  { date: "Oct", value: 15680 },
];

export const demoTriggered: TriggeredAlert[] = [
  { alert_id: 1, ticker: "NVDA", metric: "price", operator: "above", threshold: 120, current_value: 121.3, explanation: "NVDA price=121.3 is above threshold 120" },
  { alert_id: 2, ticker: "AMD", metric: "pe_ttm", operator: "below", threshold: 30, current_value: 27.4, explanation: "AMD pe_ttm=27.4 is below threshold 30" },
];

export const demoTotals = (() => {
  const value = demoHoldings.reduce((s, h) => s + (h.market_value ?? 0), 0);
  const cost = demoHoldings.reduce((s, h) => s + (h.cost_basis ?? 0), 0);
  const pnl = value - cost;
  return { value, cost, pnl, pnlPct: cost ? pnl / cost : 0, holdings: demoHoldings.length };
})();

export interface DemoInsider {
  name: string;
  role: string;
  action: "Buy" | "Sell";
  amount: string;
  date: string;
}

export const demoResearch = {
  ticker: "AAPL",
  name: "Apple Inc.",
  price: 213.4,
  priceChange: 0.012,
  peTtm: 32.1,
  peSector: 28,
  revenueGrowth: 0.049,
  insider: [
    { name: "Tim Cook", role: "CEO", action: "Sell", amount: "$12.4M", date: "14 mag" },
    { name: "Luca Maestri", role: "CFO", action: "Sell", amount: "$3.1M", date: "2 giu" },
    { name: "Art Levinson", role: "Dir.", action: "Buy", amount: "$1.8M", date: "18 giu" },
  ] as DemoInsider[],
  aiNote:
    "AAPL mantiene una posizione competitiva solida nel segmento premium con margini lordi stabili al 46%. Il rallentamento della crescita in Cina (-8% YoY) rimane il principale rischio near-term. Il ciclo di upgrade iPhone 16 appare in linea con le attese. Valutazione a premio rispetto ai peer giustificata dall'ecosistema, ma upside limitato ai prezzi correnti.",
  aiOutlook: "Outlook: neutrale/accumulate su debolezza.",
};

export const demoBrief = {
  date: "24 giu 2026",
  sections: [
    {
      title: "Macro context",
      body: "Fed ha mantenuto i tassi invariati al 4.25–4.50%. CPI di maggio +3.1% YoY, sopra attese. Mercati prezzano un taglio a settembre con probabilità 62%.",
    },
    {
      title: "Portafoglio — settimana",
      body: "NVDA +4.2% su guidance positiva data center. MU flat in attesa earnings 26 giu. MRVL -1.1% su profit taking. Performance portafoglio: +2.8% vs S&P500 +1.1%.",
    },
    {
      title: "Watchlist e azioni suggerite",
      body: "Considerare riduzione esposizione NVDA (68% risk contribution). MU earnings il 26 giu — attesi EPS $1.48, revenue $8.9B. Monitorare guidance MRVL su custom silicon AI.",
    },
  ],
};

export interface DemoAlertRow {
  ticker: string;
  condition: string;
  current: string;
  status: "Triggerato" | "OK";
}

export const demoAlertsList: DemoAlertRow[] = [
  { ticker: "NVDA", condition: "Price above $200", current: "Attuale: $200.04", status: "Triggerato" },
  { ticker: "MU", condition: "P/E below 15x", current: "Attuale: 18.2x", status: "OK" },
  { ticker: "MRVL", condition: "Insider buy > $1M", current: "Nessuna attività", status: "OK" },
];
