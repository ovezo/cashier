const symbolByCurrency: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  TRY: "₺",
  JPY: "¥",
};

export function currencySymbol(currency: string): string {
  return symbolByCurrency[currency] ?? currency + " ";
}

export function formatAmount(amount: number, currency: string): string {
  const sym = currencySymbol(currency);
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${sym}${formatted}`;
}

export function formatSigned(amount: number, currency: string, type: "income" | "expense"): string {
  const sym = currencySymbol(currency);
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = type === "income" ? "+" : "−";
  return `${sign}${sym}${formatted}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function relativeDayLabel(iso: string): string {
  const today = todayIso();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return formatDate(iso);
}
