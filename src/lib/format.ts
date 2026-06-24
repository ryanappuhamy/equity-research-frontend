// Display formatters. Every number that reaches the screen goes through one of these.

export function fmtCurrency(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: opts?.compact ? 1 : 2,
  }).format(value);
}

export function fmtNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

// Accepts a ratio (0.128 -> "12.8%"). Pass already-percent values with isRatio=false.
export function fmtPercent(
  value: number | null | undefined,
  opts?: { digits?: number; isRatio?: boolean; signed?: boolean },
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const digits = opts?.digits ?? 1;
  const pct = opts?.isRatio === false ? value : value * 100;
  const sign = opts?.signed && pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

export function fmtMultiple(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}x`;
}

export function fmtPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function deltaDirection(value: number | null | undefined): "up" | "down" | "flat" {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}
