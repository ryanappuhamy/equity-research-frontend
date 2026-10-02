import { TradingViewEconomicCalendar } from "@/components/charts/tradingview-economic-calendar";
import { Shell } from "@/components/layout/shell";
import { Topbar } from "@/components/layout/topbar";

export default function MacroPage() {
  return (
    <Shell>
      <Topbar title="Macro" subtitle="Calendario economico USA: dati in uscita, stime e valori precedenti." />
      <div className="flex flex-col gap-6 px-6 pb-6 pt-4">
        <div className="animate-rise overflow-hidden rounded-[22px] border border-border bg-card p-3">
          <TradingViewEconomicCalendar />
        </div>
      </div>
    </Shell>
  );
}
