"use client";

import { useEffect, useRef } from "react";

import { ResizableWidgetContainer } from "@/components/ui/resizable-widget-container";

const SCRIPT_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

const DEFAULT_CHART_HEIGHT_PX = 550;
const CHART_HEIGHT_STORAGE_KEY = "tradingview-advanced-chart-height";

function toTradingViewSymbol(ticker: string): string {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return "NASDAQ:AAPL";
  return normalized.includes(":") ? normalized : `NASDAQ:${normalized}`;
}

function buildWidgetConfig(ticker: string) {
  return {
    autosize: true,
    symbol: toTradingViewSymbol(ticker),
    interval: "D",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    backgroundColor: "#0a0f1d",
    gridColor: "rgba(255, 255, 255, 0.06)",
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_side_toolbar: false,
    allow_symbol_change: false,
    save_image: false,
    calendar: false,
    withdateranges: true,
    studies: ["Volume@tv-basicstudies", "MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
    support_host: "https://www.tradingview.com",
  };
}

export function TradingViewAdvancedChart({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ticker.trim()) return;

    container.replaceChildren();

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = SCRIPT_SRC;
    script.async = true;
    script.textContent = JSON.stringify(buildWidgetConfig(ticker));

    container.appendChild(widget);
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [ticker]);

  return (
    <ResizableWidgetContainer
      storageKey={CHART_HEIGHT_STORAGE_KEY}
      defaultHeight={DEFAULT_CHART_HEIGHT_PX}
      className="rounded-xl border border-white/[0.06] bg-[#0a0f1d]"
    >
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </ResizableWidgetContainer>
  );
}
