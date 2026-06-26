import { Badge } from "@/components/ui/badge";
import type { InsiderActivity, InsiderTransaction } from "@/lib/api/types";
import { fmtCompactUsd, fmtCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_TRANSACTIONS = 6;

type NormalizedInsiderTransaction = {
  name: string;
  role: string;
  action: "Buy" | "Sell";
  amountLabel: string;
  dateLabel: string;
  sortDate: number;
};

function parseAction(value: string | undefined): "Buy" | "Sell" {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized.includes("buy") ||
    normalized.includes("purchase") ||
    normalized === "p" ||
    normalized === "a"
  ) {
    return "Buy";
  }
  return "Sell";
}

function formatAmount(amount: InsiderTransaction["amount"], value?: number | null): string {
  if (typeof amount === "number") {
    return fmtCompactUsd(amount);
  }
  if (typeof amount === "string" && amount.trim()) {
    return amount.startsWith("$") ? amount : `$${amount}`;
  }
  if (value != null && !Number.isNaN(value)) {
    return value >= 1_000_000 ? fmtCompactUsd(value) : fmtCurrency(value);
  }
  return "—";
}

function formatDate(value: string | null | undefined): { label: string; sortDate: number } {
  if (!value) return { label: "—", sortDate: 0 };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { label: value, sortDate: 0 };
  }
  return {
    label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed),
    sortDate: parsed.getTime(),
  };
}

function normalizeTransaction(tx: InsiderTransaction): NormalizedInsiderTransaction {
  const name = tx.name ?? tx.insider_name ?? "Unknown insider";
  const role = tx.role ?? tx.title ?? "";
  const action = parseAction(tx.action ?? tx.transaction_type);
  const amountLabel = formatAmount(tx.amount, tx.dollar_value ?? tx.value);
  const date = formatDate(tx.date ?? tx.filing_date ?? tx.transaction_date);

  return {
    name,
    role,
    action,
    amountLabel,
    dateLabel: date.label,
    sortDate: date.sortDate,
  };
}

function getRecentTransactions(activity?: InsiderActivity): NormalizedInsiderTransaction[] {
  const rows = (activity?.transactions ?? []).map(normalizeTransaction);
  return rows
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, MAX_TRANSACTIONS);
}

export function InsiderActivityTable({ activity }: { activity?: InsiderActivity }) {
  const filings = activity?.form4_filings_last_6m;
  const transactions = getRecentTransactions(activity);

  return (
    <div className="flex flex-col gap-4">
      {filings != null && (
        <p className="text-xs text-muted-foreground">
          {filings} Form 4 filing{filings === 1 ? "" : "s"} in the last 6 months
          {activity?.most_recent_form4 ? ` · most recent ${activity.most_recent_form4}` : ""}
        </p>
      )}

      {transactions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No individual transactions available
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {transactions.map((tx, index) => (
            <li
              key={`${tx.name}-${tx.dateLabel}-${index}`}
              className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{tx.name}</p>
                {tx.role && <p className="truncate text-xs text-muted-foreground">{tx.role}</p>}
              </div>

              <div className="flex items-center gap-2 sm:justify-center">
                <Badge
                  variant="outline"
                  className={cn(
                    tx.action === "Buy"
                      ? "border-up/30 bg-up/10 text-up"
                      : "border-down/30 bg-down/10 text-down",
                  )}
                >
                  {tx.action}
                </Badge>
                <span className="text-sm tabular-nums text-foreground/90">{tx.amountLabel}</span>
              </div>

              <p className="shrink-0 text-sm tabular-nums text-muted-foreground sm:w-20 sm:text-right">
                {tx.dateLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
