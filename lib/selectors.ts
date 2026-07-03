import type { Account, Debt, Transaction } from "./types";
import { toPrimary } from "./currency";

/** A debt's entries can each be in a different currency (different wallet chosen each time),
 * so principal/repaid/outstanding are always expressed in the primary currency. */
export function debtTotals(debt: Debt, accounts: Account[]): { principal: number; repaid: number; outstanding: number } {
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  let principal = 0;
  let repaid = 0;
  for (const e of debt.entries) {
    const converted = toPrimary(e.amount, accountById.get(e.accountId));
    if (e.kind === "lend") principal += converted;
    else repaid += converted;
  }
  return { principal, repaid, outstanding: Math.max(principal - repaid, 0) };
}

export function accountBalance(accountId: string, transactions: Transaction[]): number {
  let balance = 0;
  for (const t of transactions) {
    if (t.status !== "confirmed") continue;
    if (t.type === "transfer") {
      if (t.accountId === accountId) balance -= t.amount;
      if (t.toAccountId === accountId) balance += t.toAmount ?? t.amount;
      continue;
    }
    if (t.accountId !== accountId) continue;
    balance += t.type === "income" ? t.amount : -t.amount;
  }
  return balance;
}

export function totalBalancePrimary(accounts: Account[], transactions: Transaction[]): number {
  return accounts.reduce((sum, a) => sum + toPrimary(accountBalance(a.id, transactions), a), 0);
}

export function periodTotals(
  transactions: Transaction[],
  accounts: Account[],
  from: string,
  to: string
): { incomePrimary: number; expensePrimary: number } {
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  let incomePrimary = 0;
  let expensePrimary = 0;
  for (const t of transactions) {
    if (t.status !== "confirmed" || t.date < from || t.date > to || t.type === "transfer") continue;
    const converted = toPrimary(t.amount, accountById.get(t.accountId));
    if (t.type === "income") incomePrimary += converted;
    else expensePrimary += converted;
  }
  return { incomePrimary, expensePrimary };
}

export function currentMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function monthBoundsOffset(offset: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/** A transaction can carry more than one category tag (e.g. "Groceries" + "Work"), so it's
 * attributed in full to each of its tags rather than split between them — percentages are
 * against total spend/income for the period, so they needn't add up to 100% when tags overlap. */
export function categoryBreakdown(
  transactions: Transaction[],
  categories: import("./types").Category[],
  accounts: Account[],
  type: "income" | "expense",
  from: string,
  to: string
) {
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const totals = new Map<string, number>();
  let periodTotal = 0;
  for (const t of transactions) {
    if (t.status !== "confirmed" || t.type !== type || t.date < from || t.date > to) continue;
    const converted = toPrimary(t.amount, accountById.get(t.accountId));
    periodTotal += converted;
    for (const categoryId of t.categoryIds ?? []) {
      totals.set(categoryId, (totals.get(categoryId) ?? 0) + converted);
    }
  }
  const rows = [...totals.entries()]
    .map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        name: category?.name ?? "Uncategorised",
        icon: category?.icon ?? "⋯",
        amount,
        pct: periodTotal > 0 ? (amount / periodTotal) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
  return { rows, grandTotal: periodTotal };
}
