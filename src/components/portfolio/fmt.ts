// Formatters shared by the Portfolio, Research and Simulator pages (en-US).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function usd(v: number, digits = 2): string {
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${v < 0 ? "-" : ""}$${abs}`;
}

export function signedUsd(v: number, digits = 2): string {
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${v > 0 ? "+" : v < 0 ? "-" : ""}$${abs}`;
}

// v is a ratio (0.12 = 12%).
export function pct(v: number, digits = 1, signed = true): string {
  const s = (v * 100).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${signed && v > 0 ? "+" : ""}${s}%`;
}

export function num(v: number, digits = 1): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// "2026-10-02" -> "Oct 2, 2026"; "2026-10" -> "Oct 2026".
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d ? `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}` : `${MONTHS[Number(m) - 1]} ${y}`;
}

export function monthShort(iso: string): string {
  return MONTHS[Number(iso.slice(5, 7)) - 1];
}

export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${iso.slice(0, 10)}T00:00:00`).getTime() - today.getTime()) / 864e5);
}

export const toneClass = (v: number) => (v >= 0 ? "text-up" : "text-down");
