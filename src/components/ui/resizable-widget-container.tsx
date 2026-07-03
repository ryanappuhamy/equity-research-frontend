"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export const RESIZABLE_WIDGET_MIN_HEIGHT = 300;
export const RESIZABLE_WIDGET_MAX_HEIGHT = 900;

function clampHeight(height: number): number {
  return Math.min(RESIZABLE_WIDGET_MAX_HEIGHT, Math.max(RESIZABLE_WIDGET_MIN_HEIGHT, height));
}

function readStoredHeight(storageKey: string, defaultHeight: number): number {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultHeight;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? clampHeight(parsed) : defaultHeight;
  } catch {
    return defaultHeight;
  }
}

function syncEmbeddedIframes(container: HTMLElement) {
  container.querySelectorAll("iframe").forEach((iframe) => {
    iframe.style.height = "100%";
    iframe.style.width = "100%";
  });
  window.dispatchEvent(new Event("resize"));
}

type ResizableWidgetContainerProps = {
  storageKey: string;
  defaultHeight: number;
  className?: string;
  children: ReactNode;
};

export function ResizableWidgetContainer({
  storageKey,
  defaultHeight,
  className = "",
  children,
}: ResizableWidgetContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const [height, setHeight] = useState(defaultHeight);

  useEffect(() => {
    setHeight(readStoredHeight(storageKey, defaultHeight));
  }, [storageKey, defaultHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    syncEmbeddedIframes(container);

    const observer = new ResizeObserver(() => {
      syncEmbeddedIframes(container);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [height]);

  const persistHeight = useCallback(
    (nextHeight: number) => {
      const clamped = clampHeight(nextHeight);
      setHeight(clamped);
      try {
        localStorage.setItem(storageKey, String(clamped));
      } catch {
        // Ignore quota or privacy-mode failures.
      }
    },
    [storageKey],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      dragRef.current = { startY: event.clientY, startHeight: height };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [height],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragRef.current) return;
      const delta = event.clientY - dragRef.current.startY;
      persistHeight(dragRef.current.startHeight + delta);
    },
    [persistHeight],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div className="h-full w-full">{children}</div>
      <button
        type="button"
        aria-label="Resize widget"
        className="absolute right-0 bottom-0 z-10 flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-tl-md border border-white/[0.08] bg-[#111827]/90 text-slate-400 transition-colors hover:bg-[#1f2937] hover:text-slate-200"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="h-3 w-3"
          fill="currentColor"
        >
          <path d="M12 8v4H8l4-4zm-4 0L4 12H0V8l4 4 4-4z" />
        </svg>
      </button>
    </div>
  );
}
