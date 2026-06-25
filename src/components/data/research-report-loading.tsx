"use client";

import { useEffect, useState } from "react";

const FINANCE_FACTS = [
  {
    term: "P/E Ratio",
    definition:
      "The price-to-earnings ratio divides a company's share price by its earnings per share. If a stock trades at $200 with EPS of $10, its P/E is 20x — meaning investors pay $20 for every $1 of annual profit. A P/E of 15–20 is often considered market-average; tech growth names like NVDA have traded above 40x when investors expect rapid earnings growth. Compare P/E to sector peers, not in isolation — a utility at 12x and a software company at 35x can both be fairly valued for their industries.",
  },
  {
    term: "EV/EBITDA",
    definition:
      "Enterprise value divided by EBITDA measures what it would cost to buy the whole company relative to its operating cash earnings. Unlike P/E, EV/EBITDA includes debt — so a company with $5B in debt and $2B in EBITDA might trade at 8x EV/EBITDA even if its equity P/E looks cheap. A typical range is 8–12x for mature businesses; high-growth or acquisition targets can exceed 20x. Private equity firms often use this metric because it strips out capital structure differences and makes cross-company comparisons cleaner.",
  },
  {
    term: "Insider Buying",
    definition:
      "Insider buying occurs when CEOs, directors, or other executives purchase their own company's stock in the open market. These trades must be reported to the SEC via Form 4 filings within two business days. A cluster of insider buys — say, three executives buying $500K+ each in the same month — is often read as a bullish signal because insiders have the best view of business momentum. One isolated small purchase is less meaningful; context and size matter.",
  },
  {
    term: "Free Cash Flow",
    definition:
      "Free cash flow (FCF) is the cash a company generates after paying operating expenses and capital expenditures. Apple, for example, has reported FCF exceeding $100B in strong years — money it can return via dividends, buybacks, or reinvestment. FCF yield (FCF ÷ market cap) above 5% is often considered attractive for value investors. Unlike accounting earnings, FCF is harder to manipulate, which is why many analysts call it the most honest measure of financial health.",
  },
  {
    term: "Beta",
    definition:
      "Beta measures how much a stock moves relative to the S&P 500. A beta of 1.0 means the stock tends to move in line with the market; a beta of 1.5 means it typically swings 50% more. Defensive stocks like utilities often have betas around 0.5, while high-growth tech names can exceed 1.3. If the market drops 10% and your stock has a beta of 1.5, you might expect roughly a 15% decline — though beta is based on historical data and does not predict every downturn.",
  },
  {
    term: "Short Interest",
    definition:
      "Short interest is the percentage of a company's shares sold short by investors betting the price will fall. When short interest exceeds 20% of float — as happened with GameStop in 2021 — it can signal heavy skepticism or set up a short squeeze if the stock rallies. Most large-cap stocks carry short interest below 5%. Rising short interest alongside falling price often confirms bearish sentiment; falling short interest after a rally may mean bears are covering.",
  },
  {
    term: "Earnings Surprise",
    definition:
      "An earnings surprise happens when reported EPS differs from the analyst consensus estimate. If analysts expect $1.50 and the company reports $1.72, that is a +14.7% positive surprise — historically associated with same-day stock gains of 2–5% on average. A negative surprise of similar magnitude often triggers an immediate sell-off. The market reacts to the surprise relative to expectations, not just whether earnings grew year-over-year.",
  },
  {
    term: "Forward vs Trailing P/E",
    definition:
      "Trailing P/E uses the last twelve months of reported earnings; forward P/E uses analyst estimates for the next twelve months. A company whose earnings are expected to grow 30% might show a trailing P/E of 30x but a forward P/E of 23x — the gap reflects expected improvement. Forward P/E is more useful for growth companies; trailing P/E is more reliable when earnings are stable. Always check whether estimates have been revised recently before trusting forward multiples.",
  },
  {
    term: "PEG Ratio",
    definition:
      "The PEG ratio divides a stock's P/E by its expected earnings growth rate. A company with a P/E of 30 and 30% expected growth has a PEG of 1.0 — often considered fair value. A PEG below 1.0 may suggest the stock is cheap relative to its growth; above 2.0 may signal overvaluation. Peter Lynch popularized this metric in the 1980s as a quick way to compare high-P/E growth stocks on equal footing.",
  },
  {
    term: "Analyst Consensus",
    definition:
      "Analyst consensus aggregates ratings and price targets from multiple Wall Street firms covering a stock. If 25 analysts cover AAPL with an average price target of $220 and 18 rate it Buy, that is the consensus view. Consensus targets are often slow to move — they lag sharp price changes by weeks. Treat consensus as one input among many; the average target is frequently wrong in volatile markets, but divergences between price and consensus can highlight disagreement worth researching.",
  },
] as const;

const FACT_DISPLAY_MS = 18_000;
const FADE_HALF_MS = 900;
const SLOW_NOTICE_DELAY_MS = 5000;

const SLOW_NOTICE =
  "This platform runs on a free-tier server that sleeps when inactive. First load may take up to 60 seconds — subsequent searches are instant thanks to caching.";

export function ResearchReportLoading({ active }: { active: boolean }) {
  const [factIndex, setFactIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowSlowNotice(false);
      return;
    }

    setFactIndex(0);
    setVisible(true);
    setShowSlowNotice(false);

    let factTimeout = 0;
    let fadeTimeout = 0;

    function scheduleNext(index: number) {
      factTimeout = window.setTimeout(() => {
        setVisible(false);
        fadeTimeout = window.setTimeout(() => {
          const next = (index + 1) % FINANCE_FACTS.length;
          setFactIndex(next);
          setVisible(true);
          scheduleNext(next);
        }, FADE_HALF_MS);
      }, FACT_DISPLAY_MS);
    }

    scheduleNext(0);

    const noticeTimer = window.setTimeout(() => {
      setShowSlowNotice(true);
    }, SLOW_NOTICE_DELAY_MS);

    return () => {
      window.clearTimeout(factTimeout);
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(noticeTimer);
    };
  }, [active]);

  if (!active) return null;

  const fact = FINANCE_FACTS[factIndex];

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-6 py-16">
      <div className="max-w-2xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
          Did you know?
        </p>
        <div
          className="mt-6 transition-opacity duration-[900ms] ease-in-out"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <h2 className="text-lg font-medium tracking-tight text-foreground/90">{fact.term}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground/85">{fact.definition}</p>
        </div>
      </div>

      {showSlowNotice && (
        <p
          className="mt-10 max-w-md text-center text-xs leading-relaxed text-muted-foreground/55 transition-opacity duration-[900ms] ease-in-out"
          style={{ opacity: visible ? 1 : 0.7 }}
        >
          {SLOW_NOTICE}
        </p>
      )}
    </div>
  );
}
