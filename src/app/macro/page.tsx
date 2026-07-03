"use client";

import { TradingViewEconomicCalendar } from "@/components/charts/tradingview-economic-calendar";
import { DataCard } from "@/components/data/data-card";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";

export default function MacroCalendarPage() {
  return (
    <Shell>
      <Topbar title="Macro Calendar" />

      <div className="flex flex-col gap-6 p-6">
        <DataCard source="TradingView · United States" contentClassName="p-3">
          <TradingViewEconomicCalendar />
        </DataCard>
      </div>
    </Shell>
  );
}
