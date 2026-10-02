"use client";

import { useMemo, useState } from "react";
import { Bell, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AvailabilityGuard } from "@/components/data/availability-guard";
import { SectionLabel } from "@/components/data/section-label";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAlerts,
  useAlertsCheck,
  useCreateAlert,
  useDeleteAlert,
} from "@/lib/api/hooks";
import type { Alert, AlertMetric, TriggeredAlert } from "@/lib/api/types";
import { fmtMultiple, fmtNumber, fmtPercent, fmtPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type AlertPreset = {
  value: string;
  label: string;
  metric: AlertMetric;
  operator: "above" | "below";
};

const ALERT_PRESETS: AlertPreset[] = [
  { value: "price:above", label: "Prezzo sopra", metric: "price", operator: "above" },
  { value: "price:below", label: "Prezzo sotto", metric: "price", operator: "below" },
  { value: "pe_ttm:above", label: "P/E sopra", metric: "pe_ttm", operator: "above" },
  { value: "pe_ttm:below", label: "P/E sotto", metric: "pe_ttm", operator: "below" },
  {
    value: "insider_filings:above",
    label: "Operazioni insider oltre",
    metric: "insider_filings",
    operator: "above",
  },
];

const METRIC_LABELS: Record<AlertMetric, string> = {
  price: "Prezzo",
  pe_ttm: "P/E",
  revenue_growth_yoy: "Crescita dei ricavi",
  insider_filings: "Operazioni insider",
};

function formatCondition(alert: Alert): string {
  const metric = alert.metric as AlertMetric;
  const label = METRIC_LABELS[metric] ?? alert.metric;
  const threshold =
    metric === "price"
      ? fmtPrice(alert.threshold)
      : metric === "pe_ttm"
        ? fmtMultiple(alert.threshold)
        : metric === "revenue_growth_yoy"
          ? fmtPercent(alert.threshold)
          : fmtNumber(alert.threshold);

  return `${label} ${alert.operator === "above" ? "sopra" : "sotto"} ${threshold}`;
}

function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-6 pb-6 pt-4">
      <Skeleton className="h-48 w-full rounded-[22px]" />
    </div>
  );
}

export default function AlertsPage() {
  const [ticker, setTicker] = useState("");
  const [preset, setPreset] = useState(ALERT_PRESETS[0].value);
  const [threshold, setThreshold] = useState("");

  const alertsQuery = useAlerts();
  const checkQuery = useAlertsCheck();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();

  // Only block on the alert list. /alerts/check runs the full pipeline per
  // ticker and can take a while — let it enrich the "Stato" column in place.
  const isLoading = alertsQuery.isPending;
  const isError = alertsQuery.isError;
  const error = alertsQuery.error;

  const triggeredById = useMemo(() => {
    const map = new Map<number, TriggeredAlert>();
    for (const item of checkQuery.data?.triggered ?? []) {
      map.set(item.alert_id, item);
    }
    return map;
  }, [checkQuery.data?.triggered]);

  async function handleDelete(id: number) {
    try {
      await deleteAlert.mutateAsync(id);
      toast.success("Alert eliminato");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non è stato possibile eliminare l'alert");
    }
  }

  async function handleAdd() {
    const nextTicker = ticker.trim().toUpperCase();
    const parsedThreshold = Number(threshold);

    if (!nextTicker || !threshold) {
      toast.error("Inserisci titolo e soglia");
      return;
    }
    if (!Number.isFinite(parsedThreshold)) {
      toast.error("Soglia non valida");
      return;
    }

    const selected = ALERT_PRESETS.find((p) => p.value === preset) ?? ALERT_PRESETS[0];

    try {
      await createAlert.mutateAsync({
        ticker: nextTicker,
        metric: selected.metric,
        operator: selected.operator,
        threshold: parsedThreshold,
      });
      toast.success(`Alert creato per ${nextTicker}`);
      setTicker("");
      setThreshold("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non è stato possibile creare l'alert");
    }
  }

  const alerts = alertsQuery.data?.alerts ?? [];

  const field =
    "h-11 rounded-full border border-border bg-secondary px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-faint focus:border-primary";
  const triggeredCount = alerts.filter((a) => a.triggered || triggeredById.has(a.id)).length;

  return (
    <Shell>
      <Topbar
        title="Alert"
        subtitle={
          alerts.length
            ? `${alerts.length} attivi${triggeredCount ? ` · ${triggeredCount} scattati` : ""}`
            : "Ricevi un segnale quando prezzo o P/E di un titolo superano una soglia."
        }
      />

      {isError && (
        <p className="px-6 pt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Impossibile caricare gli alert"}</p>
      )}

      {isLoading ? (
        <AlertsSkeleton />
      ) : (
        <div className="flex flex-col gap-7 px-6 pb-6 pt-4">
          <div className="animate-rise rounded-[22px] border border-border bg-card px-3.5 py-1.5">
            <AvailabilityGuard available={alertsQuery.data?.available} note={alertsQuery.data?.note} emptyLabel="Alert non disponibili">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                    <Bell className="size-5" />
                  </span>
                  <p className="font-semibold">Nessun alert</p>
                  <p className="text-sm text-muted-foreground">Creane uno qui sotto.</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const hit = triggeredById.get(alert.id);
                  const isTriggered = alert.triggered || !!hit;
                  return (
                    <div key={alert.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto_auto] items-center gap-3.5 border-t border-border px-1 py-3.5 first:border-t-0">
                      <span className="grid size-11 place-items-center rounded-[13px] bg-secondary text-[13px] font-bold tracking-tight">
                        {alert.ticker.slice(0, 4)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {alert.ticker} · {formatCondition(alert)}
                        </div>
                        <div className="truncate text-[13px] text-muted-foreground">
                          {hit?.explanation ?? (checkQuery.isPending ? "Verifica in corso…" : "Condizione non raggiunta")}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
                          isTriggered ? "bg-warn/15 text-warn" : "bg-up/15 text-up",
                        )}
                      >
                        {isTriggered ? "Scattato" : "OK"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Elimina l'alert su ${alert.ticker}`}
                        disabled={deleteAlert.isPending}
                        onClick={() => handleDelete(alert.id)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-down"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </AvailabilityGuard>
          </div>

          <section className="animate-rise flex flex-col gap-3" style={{ "--i": 1 } as React.CSSProperties}>
            <SectionLabel>Nuovo alert</SectionLabel>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd();
              }}
              className="flex flex-col gap-4 rounded-[22px] border border-border bg-card p-[18px]"
            >
              <div className="flex flex-wrap gap-1.5">
                {ALERT_PRESETS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreset(option.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all",
                      option.value === preset
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input placeholder="Titolo (es. AAPL)" value={ticker} onChange={(e) => setTicker(e.target.value)} className={cn(field, "w-44")} autoComplete="off" />
                <input placeholder="Soglia" value={threshold} onChange={(e) => setThreshold(e.target.value)} inputMode="decimal" className={cn(field, "w-32")} />
                <button
                  type="submit"
                  disabled={createAlert.isPending}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 font-semibold text-background transition-transform active:scale-[.98] disabled:opacity-60"
                >
                  {createAlert.isPending && <Loader2 className="size-4 animate-spin" />}
                  Crea alert
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </Shell>
  );
}
