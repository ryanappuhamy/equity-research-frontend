"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiFetch } from "./client";
import type {
  Alert,
  AlertMetric,
  AlertsCheckResponse,
  AlertsResponse,
  BriefResponse,
  Holding,
  PortfolioAnalysisResponse,
  PortfolioResponse,
  ReportResponse,
} from "./types";

export const qk = {
  report: (ticker: string) => ["report", ticker] as const,
  portfolio: ["portfolio"] as const,
  analysis: ["portfolio", "analysis"] as const,
  brief: ["portfolio", "brief"] as const,
  alerts: ["alerts"] as const,
  alertsCheck: ["alerts", "check"] as const,
};

type QueryOpts<T> = Omit<UseQueryOptions<T, Error, T>, "queryKey" | "queryFn">;

export function useReport(ticker: string, peers?: string, opts?: QueryOpts<ReportResponse>) {
  const q = peers ? `?peers=${encodeURIComponent(peers)}` : "";
  return useQuery<ReportResponse, Error>({
    queryKey: qk.report(`${ticker}${q}`),
    queryFn: () => apiFetch<ReportResponse>(`/report/${encodeURIComponent(ticker)}${q}`),
    enabled: !!ticker,
    staleTime: 5 * 60_000,
    ...opts,
  });
}

export function useClearReportCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) =>
      apiFetch<{ deleted: boolean; ticker: string }>(
        `/report/${encodeURIComponent(ticker)}/cache`,
        { method: "DELETE" },
      ),
    onSuccess: (_data, ticker) => {
      qc.removeQueries({ queryKey: qk.report(ticker) });
    },
  });
}

export function usePortfolio(opts?: QueryOpts<PortfolioResponse>) {
  return useQuery<PortfolioResponse, Error>({
    queryKey: qk.portfolio,
    queryFn: () => apiFetch<PortfolioResponse>("/portfolio"),
    ...opts,
  });
}

export function usePortfolioAnalysis(opts?: QueryOpts<PortfolioAnalysisResponse>) {
  return useQuery<PortfolioAnalysisResponse, Error>({
    queryKey: qk.analysis,
    queryFn: () => apiFetch<PortfolioAnalysisResponse>("/portfolio/analysis"),
    ...opts,
  });
}

export function fetchBrief(options?: { force?: boolean; password?: string }) {
  const qs = options?.force ? "?force=true" : "";
  const headers: Record<string, string> = {};
  if (options?.force && options.password) {
    headers["X-Force-Password"] = options.password;
  }
  return apiFetch<BriefResponse>(`/portfolio/brief${qs}`, { headers });
}

export function useBrief(opts?: QueryOpts<BriefResponse>) {
  return useQuery<BriefResponse, Error>({
    queryKey: qk.brief,
    queryFn: () => fetchBrief(),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...opts,
  });
}

export function useGenerateBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fetchBrief(),
    onSuccess: (data) => {
      qc.setQueryData(qk.brief, data);
    },
  });
}

export function useRegenerateBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => fetchBrief({ force: true, password }),
    onSuccess: (data) => {
      qc.setQueryData(qk.brief, data);
    },
  });
}

export function useAlerts(opts?: QueryOpts<AlertsResponse>) {
  return useQuery<AlertsResponse, Error>({
    queryKey: qk.alerts,
    queryFn: () => apiFetch<AlertsResponse>("/alerts"),
    ...opts,
  });
}

export function useAlertsCheck(opts?: QueryOpts<AlertsCheckResponse>) {
  return useQuery<AlertsCheckResponse, Error>({
    queryKey: qk.alertsCheck,
    queryFn: () => apiFetch<AlertsCheckResponse>("/alerts/check"),
    ...opts,
  });
}

export function useSavePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (positions: Pick<Holding, "ticker" | "shares" | "avg_cost_price">[]) =>
      apiFetch<PortfolioResponse>("/portfolio", {
        method: "POST",
        body: JSON.stringify({ positions }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.portfolio });
      qc.invalidateQueries({ queryKey: qk.analysis });
    },
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      ticker: string;
      metric: AlertMetric;
      operator: "above" | "below";
      threshold: number;
    }) =>
      apiFetch<{ alert: Alert }>("/alerts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.alerts });
      qc.invalidateQueries({ queryKey: qk.alertsCheck });
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ deleted: boolean; id: number }>(`/alerts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.alerts });
      qc.invalidateQueries({ queryKey: qk.alertsCheck });
    },
  });
}
