"use client";

import { useEffect, useRef } from "react";

import { ResizableWidgetContainer } from "@/components/ui/resizable-widget-container";

const SCRIPT_SRC = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";

const DEFAULT_CALENDAR_HEIGHT_PX = 800;
const CALENDAR_HEIGHT_STORAGE_KEY = "tradingview-macro-calendar-height";

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
    <ResizableWidgetContainer
      storageKey={CALENDAR_HEIGHT_STORAGE_KEY}
      defaultHeight={DEFAULT_CALENDAR_HEIGHT_PX}
      className="rounded-lg border border-white/[0.04] bg-[#0a0f1d]"
    >
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </ResizableWidgetContainer>
  );
}
