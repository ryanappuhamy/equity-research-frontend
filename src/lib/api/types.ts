// Mirrors the FastAPI backend response shapes.
// Backend convention: any block can degrade to { available: false, note }.

export interface Available {
  available?: boolean;
  note?: string;
}

export interface Holding {
  ticker: string;
  shares: number;
  avg_cost_price: number;
  updated_at?: string | null;
  current_price?: number | null;
  market_value?: number;
  cost_basis?: number;
  pnl?: number;
  pnl_pct?: number | null;
  weight?: number;
}

export interface PortfolioResponse {
  positions: Holding[];
  count: number;
  available?: boolean;
  note?: string;
}

export interface HoldingRisk {
  ticker: string;
  weight: number;
  annualized_volatility: number;
  beta_vs_spy: number;
  risk_contribution_pct: number;
  rate_sensitivity: number;
}

export interface RiskScenario {
  estimated_portfolio_return: number;
  description: string;
}

export interface RiskAnalysis extends Available {
  lookback?: string;
  holdings_count?: number;
  portfolio_annualized_volatility?: number;
  correlation_matrix?: Record<string, Record<string, number>>;
  holdings_risk?: HoldingRisk[];
  scenarios?: Record<string, RiskScenario>;
}

export interface PortfolioAnalysisResponse {
  portfolio: Holding[];
  risk: RiskAnalysis;
}

export interface BriefResponse {
  portfolio: Holding[];
  brief: string;
  generated_at?: string | null;
  cached_at?: string | null;
  cached?: boolean;
}

export interface Alert {
  id: number;
  ticker: string;
  metric: string;
  operator: "above" | "below";
  threshold: number;
  triggered: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AlertsResponse {
  alerts: Alert[];
  count: number;
  available?: boolean;
  note?: string;
}

export interface TriggeredAlert {
  alert_id: number;
  ticker: string;
  metric: string;
  operator: string;
  threshold: number;
  current_value: number;
  explanation: string;
}

export interface AlertsCheckResponse {
  triggered: TriggeredAlert[];
  count: number;
  note?: string;
}

export interface Fundamentals extends Available {
  source?: string;
  company_name?: string;
  sector?: string;
  industry?: string;
  market_cap?: number;
  pe_ttm?: number;
  forward_pe?: number;
  trailing_pe?: number;
  peg_ratio?: number;
  ev_ebitda?: number;
  ev_revenue?: number;
  price_to_book?: number;
  gross_margin?: number;
  operating_margin?: number;
  net_margin?: number;
  roe?: number;
  roic?: number;
  debt_to_equity?: number;
  current_ratio?: number;
  revenue_growth_yoy?: number;
  eps_growth_yoy?: number;
  revenue_forward?: number;
  revenue_ttm?: number;
  ebitda_ttm?: number;
  net_income_ttm?: number;
  revenue_yoy?: number;
  ebitda_yoy?: number;
  net_income_yoy?: number;
  fcf_yield?: number;
  dividend_yield?: number;
}

export interface PriceStats extends Available {
  last_price?: number;
  return_1y?: number;
  annualized_return?: number;
  annualized_volatility?: number;
  sharpe_ratio?: number | null;
  max_drawdown?: number;
  high_52w?: number | null;
  low_52w?: number | null;
}

export interface ReportData {
  ticker: string;
  fundamentals?: Fundamentals;
  price_stats?: PriceStats;
  peers?: string[];
  comps_table?: Record<string, unknown>[];
  relative_valuation?: Record<string, unknown> & Available;
  insider_activity?: Available & Record<string, unknown>;
  analyst_consensus?: Available & Record<string, unknown>;
  macro_context?: Available & Record<string, unknown>;
  transcript_analysis?: Available & Record<string, unknown>;
}

export interface ReportResponse {
  ticker: string;
  report: string;
  data: ReportData;
  available?: boolean;
  note?: string;
}

export type AlertMetric = "pe_ttm" | "price" | "revenue_growth_yoy" | "insider_filings";
