"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { SectionLabel } from "@/components/data/section-label";
import { Shell } from "@/components/layout/shell";
import { CountUp } from "@/components/portfolio/count-up";
import { fmtDate, pct, signedUsd, toneClass, usd } from "@/components/portfolio/fmt";
import { Holdings } from "@/components/portfolio/holdings";
import {
  Advanced,
  Contribution,
  HealthCards,
  InfoList,
  NewsList,
  TaxCard,
  Toggle,
} from "@/components/portfolio/insights";
import { LineChart } from "@/components/portfolio/line-chart";
import { yearStats, type Pos } from "@/components/portfolio/model";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePortfolio,
  usePortfolioAnalysis,
  usePortfolioInsights,
  usePortfolioPerformance,
  useSavePortfolio,
} from "@/lib/api/hooks";
import type { BenchmarkTicker } from "@/lib/portfolio-performance";
import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "1S", days: 5 },
  { label: "1M", days: 21 },
  { label: "6M", days: 126 },
  { label: "1A", days: 252 },
  { label: "5A", days: 0 },
] as const;

const BENCHMARKS: { t: BenchmarkTicker; name: string; desc: string }[] = [
  { t: "SPY", name: "S&P 500", desc: "SPY · 500 aziende USA" },
  { t: "URTH", name: "MSCI World", desc: "URTH · paesi sviluppati" },
  { t: "VT", name: "All-World", desc: "VT · tutto il mondo" },
  { t: "QQQ", name: "Nasdaq 100", desc: "QQQ · tech e crescita USA" },
];

const PERIOD_NAME: Record<number, string> = {
  5: "nell'ultima settimana",
  21: "nell'ultimo mese",
  126: "negli ultimi 6 mesi",
  252: "nell'ultimo anno",
  0: "negli ultimi 5 anni",
};

const bigMoney = (v: number) => {
  const s = usd(v);
  const i = s.lastIndexOf(".");
  return (
    <>
      {s.slice(0, i)}
      <span className="text-[0.55em] tracking-[-0.02em] text-muted-foreground">{s.slice(i)}</span>
    </>
  );
};

export default function PortfolioPage() {
  const [period, setPeriod] = useState<number>(252);
  const [showBench, setShowBench] = useState(true);
  const [bench, setBench] = useState<BenchmarkTicker>("SPY");
  const [scrub, setScrub] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, isError, error } = usePortfolio();
  const { data: insights } = usePortfolioInsights();
  const { data: analysis } = usePortfolioAnalysis();
  const { data: perf } = usePortfolioPerformance(bench);
  const { data: perfSpy } = usePortfolioPerformance("SPY");
  const save = useSavePortfolio();

  const holdings = useMemo(() => data?.positions ?? [], [data]);
  const positions: Pos[] = useMemo(() => {
    const byT = Object.fromEntries((insights?.holdings ?? []).map((h) => [h.ticker, h]));
    const rows = holdings.map((h) => {
      const ins = byT[h.ticker.toUpperCase()];
      const price = h.current_price ?? ins?.price ?? 0;
      const prev = ins?.prev_close ?? price;
      return {
        ticker: h.ticker.toUpperCase(),
        shares: h.shares,
        avg: h.avg_cost_price,
        price,
        value: h.shares * price,
        cost: h.shares * h.avg_cost_price,
        gain: h.shares * (price - h.avg_cost_price),
        weight: 0,
        dayChange: h.shares * (price - prev),
        dayPct: prev ? price / prev - 1 : 0,
        sector: h.sector ?? null,
        ins,
      };
    });
    const total = rows.reduce((s, p) => s + p.value, 0);
    return rows.map((p) => ({ ...p, weight: total ? p.value / total : 0 }));
  }, [holdings, insights]);

  const total = positions.reduce((s, p) => s + p.value, 0);
  const cost = positions.reduce((s, p) => s + p.cost, 0);
  const dayChange = positions.reduce((s, p) => s + p.dayChange, 0);

  const series = useMemo(() => perf?.series ?? [], [perf]);
  const window_ = useMemo(() => (period ? series.slice(-(period + 1)) : series), [series, period]);
  const benchName = BENCHMARKS.find((b) => b.t === bench)!.name;
  const stats = useMemo(() => yearStats(perfSpy?.series ?? []), [perfSpy]);

  const pv = window_.map((p) => p.nav);
  const bv = window_.map((p) => p.benchmark);
  const pr = pv.length > 1 ? pv[pv.length - 1] / pv[0] - 1 : 0;
  const br = bv.length > 1 ? bv[bv.length - 1] / bv[0] - 1 : 0;
  const lineColor = pr >= 0 ? "var(--up)" : "var(--down)";

  const removePosition = (ticker: string) => {
    const next = holdings
      .filter((h) => h.ticker.toUpperCase() !== ticker)
      .map(({ ticker, shares, avg_cost_price }) => ({ ticker, shares, avg_cost_price }));
    save.mutate(next, {
      onSuccess: () => toast.success(`${ticker} rimosso`),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Non è stato possibile salvare"),
    });
  };

  return (
    <Shell>
      <div className="flex flex-col gap-7 px-6 pb-6 pt-6">
        {isError && (
          <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Impossibile caricare il portafoglio"}</p>
        )}

        {isLoading ? (
          <PortfolioSkeleton />
        ) : !positions.length ? (
          <EmptyState onAdd={() => setSheetOpen(true)} />
        ) : (
          <>
            {/* Hero */}
            <div className="animate-rise flex items-start justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-[13px] font-medium text-muted-foreground">
                  {scrub == null ? "Valore del portafoglio" : "Valore simulato"}
                </span>
                <CountUp
                  value={scrub == null ? total : pv[scrub]}
                  format={bigMoney}
                  duration={scrub == null ? 900 : 250}
                  className="text-[clamp(40px,8vw,64px)] font-semibold leading-none tracking-[-0.035em]"
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-semibold">
                  {scrub == null ? (
                    <>
                      <span className={toneClass(dayChange)}>
                        {dayChange >= 0 ? "▲" : "▼"} {signedUsd(dayChange)} ({pct(dayChange / (total - dayChange), 2)}){" "}
                        <span className="font-medium text-muted-foreground">oggi</span>
                      </span>
                      <span className={toneClass(total - cost)}>
                        {signedUsd(total - cost)} ({pct(total / cost - 1)}){" "}
                        <span className="font-medium text-muted-foreground">dall&apos;acquisto</span>
                      </span>
                    </>
                  ) : (
                    <span className={toneClass(pv[scrub] - pv[0])}>
                      {pv[scrub] >= pv[0] ? "▲" : "▼"} {signedUsd(pv[scrub] - pv[0])} ({pct(pv[scrub] / pv[0] - 1, 2)}){" "}
                      <span className="font-medium text-muted-foreground">nel periodo</span>
                    </span>
                  )}
                </div>
                <span className="min-h-[18px] text-[13px] text-muted-foreground">
                  {scrub != null && window_[scrub]
                    ? `${fmtDate(window_[scrub].date)}${showBench ? ` · ${benchName} ${pct(bv[scrub] / bv[0] - 1)}` : ""}`
                    : ""}
                </span>
              </div>
              <button
                type="button"
                aria-label="Aggiungi posizione"
                onClick={() => setSheetOpen(true)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-200 hover:rotate-90 hover:scale-105"
              >
                <Plus className="size-5" strokeWidth={2.6} />
              </button>
            </div>

            {/* Chart */}
            <div className="animate-rise" style={{ "--i": 1 } as React.CSSProperties}>
              <div className="-mx-1">
                {pv.length > 1 ? (
                  <LineChart
                    key={`${period}-${bench}`}
                    ariaLabel="Andamento del portafoglio"
                    labels={window_.map((p) => p.date)}
                    series={[
                      { values: pv, color: lineColor, area: true, width: 2.4 },
                      ...(showBench ? [{ values: bv, color: "var(--muted-foreground)", dashed: true, width: 1.6 }] : []),
                    ]}
                    onScrub={setScrub}
                  />
                ) : (
                  <Skeleton className="h-[280px] w-full rounded-2xl" />
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-0.5 rounded-full border border-border bg-card p-[3px]">
                  {PERIODS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setPeriod(p.days)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors",
                        period === p.days ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Toggle checked={showBench} onChange={setShowBench} label="Confronta con" />
                  <BenchmarkPicker value={bench} onChange={setBench} disabled={!showBench} />
                </div>
              </div>
              {pv.length > 1 && (
                <p className="mt-3 text-sm text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                  Portafoglio <b className={toneClass(pr)}>{pct(pr)}</b>
                  {showBench ? (
                    <>
                      {" "}contro {benchName} <b>{pct(br)}</b> {PERIOD_NAME[period]}: {pr - br >= 0 ? "stai battendo" : "sei sotto"} l&apos;indice di{" "}
                      <b>{Math.abs((pr - br) * 100).toFixed(1).replace(".", ",")} punti</b>.
                    </>
                  ) : (
                    <> {PERIOD_NAME[period]}.</>
                  )}
                </p>
              )}
            </div>

            <Section i={2} title="Le tue posizioni" sub={`${positions.length} titoli`}>
              <Holdings positions={positions} onRemove={removePosition} />
            </Section>

            <Section i={3} title="Salute del portafoglio" sub="ultimi 12 mesi">
              <HealthCards positions={positions} stats={stats} risk={analysis?.risk} benchName="S&P 500" indexPe={insights?.index_pe ?? null} />
            </Section>

            <Section i={4} title="Da dove arriva il guadagno" sub="P&L non realizzato">
              <Contribution positions={positions} />
            </Section>

            <Section i={5} title="Tasse se vendessi oggi" sub="stima">
              <TaxCard positions={positions} />
            </Section>

            <div className="animate-rise grid grid-cols-2 gap-3 max-[680px]:grid-cols-1" style={{ "--i": 6 } as React.CSSProperties}>
              <div className="flex min-w-0 flex-col gap-3">
                <SectionLabel>Informazioni</SectionLabel>
                <div className="rounded-[22px] border border-border bg-card p-[18px]">
                  <InfoList positions={positions} />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <SectionLabel>Notizie sui tuoi titoli</SectionLabel>
                <div className="rounded-[22px] border border-border bg-card p-[18px]">
                  <NewsList positions={positions} asOf={insights?.as_of} />
                </div>
              </div>
            </div>

            <div className="animate-rise" style={{ "--i": 7 } as React.CSSProperties}>
              <Advanced positions={positions} risk={analysis?.risk} />
            </div>

            <p className="text-[12.5px] text-faint">
              Il grafico ricostruisce il valore con le posizioni attuali: le date di acquisto non sono ancora salvate.
            </p>
          </>
        )}
      </div>

      <AddPositionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        saving={save.isPending}
        onSave={(p) => {
          const next = [
            ...holdings
              .filter((h) => h.ticker.toUpperCase() !== p.ticker)
              .map(({ ticker, shares, avg_cost_price }) => ({ ticker, shares, avg_cost_price })),
            p,
          ];
          save.mutate(next, {
            onSuccess: () => {
              toast.success(`${p.ticker} salvato`);
              setSheetOpen(false);
            },
            onError: (e) => toast.error(e instanceof Error ? e.message : "Non è stato possibile salvare"),
          });
        }}
      />
    </Shell>
  );
}

function Section({ i, title, sub, children }: { i: number; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="animate-rise flex flex-col gap-3" style={{ "--i": i } as React.CSSProperties}>
      <div className="flex items-baseline justify-between gap-3">
        <SectionLabel>{title}</SectionLabel>
        {sub && <span className="text-[13px] text-muted-foreground">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

function BenchmarkPicker({
  value,
  onChange,
  disabled,
}: {
  value: BenchmarkTicker;
  onChange: (t: BenchmarkTicker) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", close);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("keydown", esc);
    };
  }, []);
  const current = BENCHMARKS.find((b) => b.t === value)!;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-3 pr-2.5 text-[13px] font-semibold transition-[border-color,opacity] hover:border-muted-foreground disabled:cursor-default disabled:opacity-40"
      >
        {current.name}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={cn("transition-transform duration-200", open && "rotate-180")}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        role="listbox"
        className={cn(
          "absolute bottom-[calc(100%+8px)] right-0 z-20 min-w-[210px] origin-bottom-right rounded-2xl border border-border bg-popover p-1.5 shadow-[0_18px_40px_rgba(0,0,0,.5)] transition-[opacity,transform] duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-1.5 scale-[.97] opacity-0",
        )}
      >
        {BENCHMARKS.map((b) => (
          <button
            key={b.t}
            type="button"
            role="option"
            aria-selected={b.t === value}
            onClick={() => {
              onChange(b.t);
              setOpen(false);
            }}
            className="flex w-full flex-col items-start gap-px whitespace-nowrap rounded-[10px] px-2.5 py-2 text-left hover:bg-white/5"
          >
            <span className="text-[13.5px] font-semibold">
              {b.name}
              {b.t === value && <span className="text-primary"> ✓</span>}
            </span>
            <span className="text-xs text-muted-foreground">{b.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AddPositionSheet({
  open,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: { ticker: string; shares: number; avg_cost_price: number }) => void;
  saving: boolean;
}) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    const s = Number(shares);
    const p = Number(price);
    if (!t) return toast.error("Inserisci il simbolo del titolo, per esempio AAPL");
    if (!(s > 0) || !(p > 0)) return toast.error("Quantità e prezzo devono essere maggiori di zero");
    onSave({ ticker: t, shares: s, avg_cost_price: p });
  };

  const field = "rounded-[10px] border border-border bg-secondary px-3 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
  return (
    <>
      <div
        onClick={onClose}
        className={cn("fixed inset-0 z-40 bg-black/55 transition-opacity duration-300", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-title"
        className={cn(
          "fixed bottom-0 left-1/2 z-50 w-[min(520px,100%)] -translate-x-1/2 rounded-t-[26px] border border-b-0 border-border bg-card px-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-2.5 transition-transform duration-500 ease-[cubic-bezier(.2,.9,.25,1)]",
          open ? "translate-y-0" : "translate-y-[105%]",
        )}
      >
        <div className="mx-auto mb-3.5 h-[5px] w-10 rounded-full bg-border" />
        <h3 id="add-title" className="text-xl font-semibold tracking-tight">Aggiungi posizione</h3>
        <p className="text-xs text-faint">Se il titolo è già nel portafoglio, quantità e prezzo medio vengono aggiornati.</p>
        <form onSubmit={submit} className="mt-3.5 grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
            Titolo
            <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" autoComplete="off" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
            Quantità
            <input value={shares} onChange={(e) => setShares(e.target.value)} type="number" min="0" step="any" placeholder="10" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
            Prezzo medio ($)
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="any" placeholder="150" className={field} />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-[14px] bg-foreground py-3.5 font-bold text-background transition-transform active:scale-[.98] disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />} Salva posizione
          </button>
        </form>
      </div>
    </>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 py-16">
      <h2 className="text-[28px] font-semibold tracking-tight">Il portafoglio è vuoto</h2>
      <p className="max-w-[48ch] text-muted-foreground">Aggiungi il primo titolo con quantità e prezzo medio di acquisto per vedere valore, rendimento e rischio.</p>
      <button type="button" onClick={onAdd} className="rounded-full bg-foreground px-5 py-2.5 font-semibold text-background">
        Aggiungi posizione
      </button>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-16 w-72" />
      <Skeleton className="h-[280px] w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-[22px]" />
    </div>
  );
}
