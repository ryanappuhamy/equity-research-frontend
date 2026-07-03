"use client";

import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";

const CALENDAR_HEIGHT_PX = 500;

function buildWidgetConfig() {
  return {
    width: "100%",
    height: "100%",
    colorTheme: "dark",
    isTransparent: false,
    locale: "en",
    importanceFilter: "0,1",
    countryFilter: "us",
    backgroundColor: "#0a0f1d",
  };
}

export function TradingViewEconomicCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = SCRIPT_SRC;
    script.async = true;
    script.textContent = JSON.stringify(buildWidgetConfig());

    container.appendChild(widget);
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden rounded-lg border border-white/[0.04] bg-[#0a0f1d]"
      style={{ height: CALENDAR_HEIGHT_PX }}
    />
  );
}
