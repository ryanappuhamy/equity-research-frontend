"use client";

import { useEffect, useRef } from "react";

const SCRIPT_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

const CHART_HEIGHT_PX = 400;

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
    <div
      ref={containerRef}
      className="tradingview-widget-container h-[400px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0f1d]"
      style={{ height: CHART_HEIGHT_PX }}
    />
  );
}
