"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";
import { demoAlertsList, type DemoAlertRow } from "@/lib/demo";

const alertColumns: Column<DemoAlertRow>[] = [
  {
    key: "ticker",
    header: "Ticker",
    cell: (r) => <span className="font-medium text-foreground">{r.ticker}</span>,
  },
  {
    key: "condition",
    header: "Condizione",
    cell: (r) => <span className="text-muted-foreground">{r.condition}</span>,
  },
  {
    key: "current",
    header: "Stato",
    cell: (r) => <span className="text-muted-foreground">{r.current}</span>,
  },
  {
    key: "status",
    header: "",
    align: "right",
    cell: (r) => (
      <Badge
        variant="outline"
        className={cn(
          r.status === "Triggerato"
            ? "border-[#e0894a]/40 bg-[#e0894a]/10 text-[#e0894a]"
            : "border-up/30 bg-up/10 text-up",
        )}
      >
        {r.status}
      </Badge>
    ),
  },
];

export default function AlertsPage() {
  const [ticker, setTicker] = useState("");
  const [operator, setOperator] = useState("price above");
  const [threshold, setThreshold] = useState("");

  function handleAdd() {
    if (!ticker || !threshold) {
      toast.error("Inserisci ticker e soglia");
      return;
    }
    // Demo only — the live mutation is ready in lib/api/hooks.ts (useCreateAlert).
    toast.success(`Alert demo: ${ticker.toUpperCase()} ${operator} ${threshold}`);
    setTicker("");
    setThreshold("");
  }

  return (
    <Shell>
      <Topbar title="Alert attivi" demo />

      <div className="flex flex-col gap-6 p-6">
        <DataCard contentClassName="px-2">
          <DataTable columns={alertColumns} rows={demoAlertsList} getRowKey={(r) => r.ticker} />
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
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price above">price above</SelectItem>
                <SelectItem value="price below">price below</SelectItem>
                <SelectItem value="P/E above">P/E above</SelectItem>
                <SelectItem value="P/E below">P/E below</SelectItem>
                <SelectItem value="insider buy >">insider buy &gt;</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Soglia"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              inputMode="decimal"
              className="w-28"
            />
            <Button onClick={handleAdd}>
              Aggiungi
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
