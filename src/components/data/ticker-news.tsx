"use client";

import { fmtDate } from "@/components/portfolio/fmt";
import { Skeleton } from "@/components/ui/skeleton";
import { useTickerNews } from "@/lib/api/hooks";

const toIsoDate = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);

// Recent headlines that name the company (Finnhub, last 14 days).
export function TickerNews({ ticker }: { ticker: string }) {
  const { data, isPending, isError } = useTickerNews(ticker);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 rounded-[22px] border border-border bg-card p-[18px]">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];
  if (isError || !data?.available || items.length === 0) {
    return (
      <p className="rounded-[22px] border border-border bg-card p-[18px] text-sm text-muted-foreground">
        {isError || data?.available === false
          ? "News is unavailable right now."
          : `No news naming ${ticker} in the last two weeks.`}
      </p>
    );
  }

  return (
    <div className="flex flex-col rounded-[22px] border border-border bg-card px-[18px] py-1.5">
      {items.map((n) => (
        <a
          key={n.headline}
          href={n.url ?? undefined}
          target="_blank"
          rel="noopener"
          className="group flex flex-col gap-1 border-t border-border py-3.5 first:border-t-0"
        >
          <span className="text-[15px] font-semibold leading-snug group-hover:underline">{n.headline}</span>
          {n.summary && <span className="line-clamp-2 text-[13.5px] text-muted-foreground">{n.summary}</span>}
          <span className="text-xs text-faint">
            {[n.source, n.datetime ? fmtDate(toIsoDate(n.datetime)) : null].filter(Boolean).join(" · ")}
          </span>
        </a>
      ))}
    </div>
  );
}
