"use client";

import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { getPrimaryAccount } from "@/lib/currency";
import { accountBalance, balancesByCurrency, currentMonthBounds, periodTotals } from "@/lib/selectors";
import { formatAmount, formatSigned } from "@/lib/format";
import { TransactionList } from "@/components/transactions/TransactionList";

export default function DashboardPage() {
  const accounts = useCashierStore((s) => s.accounts);
  const transactions = useCashierStore((s) => s.transactions);
  const debts = useCashierStore((s) => s.debts);

  const primary = getPrimaryAccount(accounts);
  const { start, end } = currentMonthBounds();
  const { incomePrimary, expensePrimary } = periodTotals(transactions, accounts, start, end);
  const primaryCurrency = primary?.currency ?? "";
  const balances = balancesByCurrency(accounts, transactions, primaryCurrency);
  const pending = transactions.filter((t) => t.status === "pending");
  // Take the last 6 *added* (not yet display-sorted) — TransactionList does the newest-first
  // sort itself, so pre-sorting here would double-sort and scramble same-day ordering.
  const recent = transactions.filter((t) => t.status === "confirmed").slice(-6);

  const monthLabel = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const owedToMe = debts.filter((d) => d.direction === "owed_to_me" && d.status !== "paid").length;
  const iOwe = debts.filter((d) => d.direction === "i_owe" && d.status !== "paid").length;

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <div className="font-serif text-lg font-bold">Cashier</div>
        <div className="rounded-full border border-line bg-card px-2.5 py-1 font-mono text-xs text-ink-soft">{monthLabel}</div>
      </div>

      <div className="mt-3.5 rounded-[20px] bg-accent p-5 text-white">
        <div className="text-[11px] uppercase tracking-wide text-white/65">
          Total balance{balances.length === 1 ? ` · ${balances[0].currency}` : ""}
        </div>
        {balances.length <= 1 ? (
          <div className="tabular mt-1.5 text-4xl font-semibold">{formatAmount(balances[0]?.balance ?? 0, primaryCurrency)}</div>
        ) : (
          <div className="mt-1.5 flex flex-col gap-1">
            {balances.map((b) => (
              <div key={b.currency} className="tabular text-[30px] font-semibold leading-tight">
                {formatAmount(b.balance, b.currency)}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-5 border-t border-white/15 pt-3.5 text-[11px] text-white/65">
          <div>
            Income this month
            <div className="tabular mt-0.5 text-sm text-[#8FD3A8]">{formatSigned(incomePrimary, primary?.currency ?? "", "income")}</div>
          </div>
          <div>
            Expense this month
            <div className="tabular mt-0.5 text-sm text-[#F0AE8B]">{formatSigned(expensePrimary, primary?.currency ?? "", "expense")}</div>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <Link href="/recurring" className="mt-3.5 flex items-start justify-between gap-2.5 rounded-2xl border border-[#E7D6A2] bg-pending-soft p-3.5">
          <div>
            <div className="text-[13px] font-bold text-[#8C6A16]">
              {pending.length} item{pending.length > 1 ? "s" : ""} need{pending.length === 1 ? "s" : ""} your confirmation
            </div>
            <div className="mt-0.5 line-clamp-1 text-[12px] text-[#8C6A16]/85">
              {pending.map((p) => p.note || "Recurring item").slice(0, 3).join(" · ")}
            </div>
          </div>
          <span className="font-mono text-base text-[#8C6A16]">→</span>
        </Link>
      )}

      {(owedToMe > 0 || iOwe > 0) && (
        <Link href="/debts" className="mt-2.5 flex items-center justify-between rounded-2xl border border-line bg-card p-3.5 text-[12.5px]">
          <span className="text-ink-soft">
            {owedToMe > 0 && <>Owed to you by {owedToMe} {owedToMe === 1 ? "person" : "people"}</>}
            {owedToMe > 0 && iOwe > 0 && " · "}
            {iOwe > 0 && <>You owe {iOwe} {iOwe === 1 ? "person" : "people"}</>}
          </span>
          <span className="font-mono text-accent">→</span>
        </Link>
      )}

      <div className="mt-4 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        Accounts
        <Link href="/accounts" className="normal-case tracking-normal text-accent">Manage</Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {accounts.map((a) => (
          <div key={a.id} className="min-w-[132px] shrink-0 rounded-2xl border border-line bg-card p-2.5 px-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
              {a.isPrimary && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              {a.name}
            </div>
            <div className="tabular mt-1 text-[15px] font-semibold">{formatAmount(accountBalance(a, transactions), a.currency)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        Recent transactions
        <Link href="/transactions" className="normal-case tracking-normal text-accent">See all</Link>
      </div>
      <TransactionList transactions={recent} emptyLabel="No transactions yet — tap + to add your first one." />
    </div>
  );
}
