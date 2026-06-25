"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AvailabilityGuard } from "@/components/data/availability-guard";
import { DataCard } from "@/components/data/data-card";
import { DataTable, type Column } from "@/components/data/data-table";
import { SectionLabel } from "@/components/data/section-label";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  { value: "price:above", label: "price above", metric: "price", operator: "above" },
  { value: "price:below", label: "price below", metric: "price", operator: "below" },
  { value: "pe_ttm:above", label: "P/E above", metric: "pe_ttm", operator: "above" },
  { value: "pe_ttm:below", label: "P/E below", metric: "pe_ttm", operator: "below" },
  {
    value: "insider_filings:above",
    label: "insider buy >",
    metric: "insider_filings",
    operator: "above",
  },
];

const METRIC_LABELS: Record<AlertMetric, string> = {
  price: "Price",
  pe_ttm: "P/E",
  revenue_growth_yoy: "Revenue growth",
  insider_filings: "Insider filings",
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

  return `${label} ${alert.operator} ${threshold}`;
}

function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-48 w-full" />
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

  const isLoading = alertsQuery.isPending || checkQuery.isPending;
  const isError = alertsQuery.isError || checkQuery.isError;
  const error = alertsQuery.error ?? checkQuery.error;

  const triggeredById = useMemo(() => {
    const map = new Map<number, TriggeredAlert>();
    for (const item of checkQuery.data?.triggered ?? []) {
      map.set(item.alert_id, item);
    }
    return map;
  }, [checkQuery.data?.triggered]);

  const columns: Column<Alert>[] = useMemo(
    () => [
      {
        key: "ticker",
        header: "Ticker",
        cell: (alert) => <span className="font-medium text-foreground">{alert.ticker}</span>,
      },
      {
        key: "condition",
        header: "Condizione",
        cell: (alert) => (
          <span className="text-muted-foreground">{formatCondition(alert)}</span>
        ),
      },
      {
        key: "current",
        header: "Stato",
        cell: (alert) => {
          const triggered = triggeredById.get(alert.id);
          return (
            <span className="text-muted-foreground">
              {triggered?.explanation ?? "Within threshold"}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "",
        align: "right",
        cell: (alert) => {
          const isTriggered = alert.triggered || triggeredById.has(alert.id);
          return (
            <Badge
              variant="outline"
              className={cn(
                isTriggered
                  ? "border-[#e0894a]/40 bg-[#e0894a]/10 text-[#e0894a]"
                  : "border-up/30 bg-up/10 text-up",
              )}
            >
              {isTriggered ? "Triggerato" : "OK"}
            </Badge>
          );
        },
      },
      {
        key: "actions",
        header: "",
        align: "right",
        cell: (alert) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete alert for ${alert.ticker}`}
            disabled={deleteAlert.isPending}
            onClick={() => handleDelete(alert.id)}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        ),
      },
    ],
    [triggeredById, deleteAlert.isPending],
  );

  async function handleDelete(id: number) {
    try {
      await deleteAlert.mutateAsync(id);
      toast.success("Alert deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete alert");
    }
  }

  async function handleAdd() {
    const nextTicker = ticker.trim().toUpperCase();
    const parsedThreshold = Number(threshold);

    if (!nextTicker || !threshold) {
      toast.error("Inserisci ticker e soglia");
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
      toast.success(`Alert created for ${nextTicker}`);
      setTicker("");
      setThreshold("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create alert");
    }
  }

  const alerts = alertsQuery.data?.alerts ?? [];

  return (
    <Shell>
      <Topbar title="Alert attivi" />

      {isError && (
        <p className="px-6 pt-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load alerts"}
        </p>
      )}

      {isLoading ? (
        <AlertsSkeleton />
      ) : (
        <div className="flex flex-col gap-6 p-6">
          <DataCard contentClassName="px-2">
            <AvailabilityGuard
              available={alertsQuery.data?.available}
              note={alertsQuery.data?.note}
              emptyLabel="Alerts unavailable"
            >
              <DataTable
                columns={columns}
                rows={alerts}
                getRowKey={(alert) => alert.id}
                empty="No alerts configured"
              />
            </AvailabilityGuard>
          </DataCard>

          <div className="flex flex-col gap-3">
            <SectionLabel>Aggiungi alert</SectionLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-32"
              />
              <Select value={preset} onValueChange={(v) => v && setPreset(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_PRESETS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Soglia"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                inputMode="decimal"
                className="w-28"
              />
              <Button onClick={handleAdd} disabled={createAlert.isPending}>
                {createAlert.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Aggiungi…
                  </>
                ) : (
                  <>
                    Aggiungi
                    <ArrowUpRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
