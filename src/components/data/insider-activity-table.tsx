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
    normalized.includes("sell") ||
    normalized.includes("sale") ||
    normalized === "s"
  ) {
    return "Sell";
  }
  if (
    normalized.includes("buy") ||
    normalized.includes("purchase") ||
    normalized === "p"
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
  const parsed = new Date(`${value}T00:00:00`);
  const date = Number.isNaN(parsed.getTime()) ? new Date(value) : parsed;
  if (Number.isNaN(date.getTime())) {
    return { label: value, sortDate: 0 };
  }
  return {
    label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
    sortDate: date.getTime(),
  };
}

function normalizeTransaction(tx: InsiderTransaction): NormalizedInsiderTransaction {
  const name = tx.name ?? tx.insider_name ?? "Unknown insider";
  const role = tx.role ?? tx.title ?? "";
  const action = parseAction(tx.action ?? tx.transaction_type);
  const amountLabel = formatAmount(tx.amount, tx.dollar_value ?? tx.value);
  const date = formatDate(tx.date ?? tx.transaction_date ?? tx.filing_date);

  return {
    name,
    role,
    action,
    amountLabel,
    dateLabel: date.label,
    sortDate: date.sortDate,
  };
}

export function getRecentTransactions(activity?: InsiderActivity): NormalizedInsiderTransaction[] {
  const rows = (activity?.transactions ?? []).map(normalizeTransaction);
  return rows.sort((a, b) => b.sortDate - a.sortDate).slice(0, MAX_TRANSACTIONS);
}

function ActionBadge({ action }: { action: "Buy" | "Sell" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-11 justify-center",
        action === "Buy"
          ? "border-up/30 bg-up/10 text-up"
          : "border-down/30 bg-down/10 text-down",
      )}
    >
      {action}
    </Badge>
  );
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

      {transactions.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-card/40">
          <ul className="divide-y divide-white/[0.04]">
            {transactions.map((tx, index) => (
              <li
                key={`${tx.name}-${tx.dateLabel}-${tx.action}-${index}`}
                className="grid grid-cols-1 items-center gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{tx.name}</p>
                  {tx.role ? (
                    <p className="truncate text-xs text-muted-foreground">{tx.role}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2.5 sm:justify-center">
                  <ActionBadge action={tx.action} />
                  <span className="text-sm font-medium tabular-nums text-foreground/90">
                    {tx.amountLabel}
                  </span>
                </div>

                <p className="text-sm tabular-nums text-muted-foreground sm:min-w-[4.5rem] sm:text-right">
                  {tx.dateLabel}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
