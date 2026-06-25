"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const FINANCE_FACTS = [
  {
    term: "P/E Ratio",
    definition:
      "Price divided by earnings per share. It shows how much investors pay for each dollar of profit — a higher number usually means higher growth expectations.",
  },
  {
    term: "EV/EBITDA",
    definition:
      "Enterprise value divided by operating earnings before interest, taxes, and depreciation. It helps compare companies that carry different levels of debt.",
  },
  {
    term: "Insider Buying",
    definition:
      "When executives or directors buy their own company's stock. It is often read as a sign they believe the business is undervalued or improving.",
  },
  {
    term: "Free Cash Flow",
    definition:
      "Cash left after running the business and paying for investments. It is money the company can use for dividends, buybacks, or paying down debt.",
  },
  {
    term: "Beta",
    definition:
      "Measures how much a stock moves relative to the overall market. Above 1 means more volatile than the market; below 1 means less volatile.",
  },
  {
    term: "Short Interest",
    definition:
      "The share of stock sold short by investors betting the price will fall. High short interest can signal skepticism or set up a potential short squeeze.",
  },
  {
    term: "Earnings Surprise",
    definition:
      "When reported earnings differ from what analysts expected. A positive surprise often lifts the stock; a miss can trigger a sell-off.",
  },
  {
    term: "Forward vs Trailing P/E",
    definition:
      "Trailing P/E uses past earnings; forward P/E uses estimates for the next year. Forward reflects expectations, trailing reflects what already happened.",
  },
  {
    term: "PEG Ratio",
    definition:
      "P/E divided by expected earnings growth. It helps judge whether a high P/E might be justified by faster growth.",
  },
  {
    term: "Analyst Consensus",
    definition:
      "The average of many analysts' ratings or price targets. It is a snapshot of professional opinion, not a guarantee of future results.",
  },
] as const;

const FACT_INTERVAL_MS = 4000;
const SLOW_NOTICE_DELAY_MS = 5000;

const SLOW_NOTICE =
  "This platform runs on a free-tier server that sleeps when inactive. First load may take up to 60 seconds — subsequent searches are instant thanks to caching.";

export function ResearchReportLoading({ active }: { active: boolean }) {
  const [factIndex, setFactIndex] = useState(0);
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowSlowNotice(false);
      return;
    }

    setFactIndex(0);
    setShowSlowNotice(false);

    const factTimer = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % FINANCE_FACTS.length);
    }, FACT_INTERVAL_MS);

    const noticeTimer = window.setTimeout(() => {
      setShowSlowNotice(true);
    }, SLOW_NOTICE_DELAY_MS);

    return () => {
      window.clearInterval(factTimer);
      window.clearTimeout(noticeTimer);
    };
  }, [active]);

  if (!active) return null;

  const fact = FINANCE_FACTS[factIndex];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border/50 bg-muted/15 px-5 py-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary/60" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
              Did you know?
            </p>
            <p
              key={fact.term}
              className="mt-2 text-sm font-medium text-foreground/85 animate-in fade-in duration-300"
            >
              {fact.term}
            </p>
            <p
              key={fact.definition}
              className="mt-1.5 text-sm leading-relaxed text-muted-foreground animate-in fade-in duration-300"
            >
              {fact.definition}
            </p>
          </div>
        </div>
      </section>

      {showSlowNotice && (
        <p className="max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/70 animate-in fade-in duration-500">
          {SLOW_NOTICE}
        </p>
      )}

      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
    </div>
  );
}
