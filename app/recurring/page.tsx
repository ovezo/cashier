"use client";

import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { formatAmount, formatDateShort } from "@/lib/format";
import { frequencyLabel } from "@/lib/recurring";
import { PendingCard } from "@/components/recurring/PendingCard";

export default function RecurringPage() {
  const transactions = useCashierStore((s) => s.transactions);
  const rules = useCashierStore((s) => s.recurringRules);
  const accounts = useCashierStore((s) => s.accounts);
  const categories = useCashierStore((s) => s.categories);
  const debts = useCashierStore((s) => s.debts);
  const toggleRecurringActive = useCashierStore((s) => s.toggleRecurringActive);

  const pending = transactions.filter((t) => t.status === "pending").sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Recurring</h1>
        <Link href="/recurring/new" className="text-[13px] font-semibold text-accent">
          + New rule
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        Needs confirmation {pending.length > 0 && `· ${pending.length}`}
      </div>
      {pending.length === 0 && <p className="mt-2 text-[13px] text-ink-faint">Nothing waiting on you right now.</p>}
      {pending.map((tx) => (
        <PendingCard key={tx.id} tx={tx} />
      ))}

      <div className="mt-5 mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        Active rules {rules.length > 0 && `· ${rules.length}`}
      </div>
      {rules.length === 0 && <p className="text-[13px] text-ink-faint">No recurring rules yet.</p>}
      <div className="rounded-2xl border border-line bg-card">
        {rules.map((r) => {
          const account = accounts.find((a) => a.id === r.accountId);
          const category = categories.find((c) => c.id === r.categoryIds?.[0]);
          const debt = r.linkedDebtId ? debts.find((d) => d.id === r.linkedDebtId) : undefined;
          const name = r.note || category?.name || (debt ? `Instalment · ${debt.person}` : "Recurring");
          const isIncome = r.kind === "transaction" ? r.txType === "income" : debt?.direction === "owed_to_me";
          return (
            <button
              key={r.id}
              onClick={() => toggleRecurringActive(r.id)}
              className="flex w-full items-center gap-2.5 border-b border-line p-3.5 text-left last:border-b-0"
            >
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-paper-deep text-[15px]">
                {category?.icon ?? (debt ? "🤝" : "🔁")}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[13px] font-semibold ${!r.active ? "text-ink-faint line-through" : ""}`}>{name}</div>
                <div className="text-[11px] text-ink-faint">{frequencyLabel[r.frequency]}{!r.active && " · Paused"}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`tabular text-[13px] ${isIncome ? "text-income" : "text-expense"}`}>
                  {isIncome ? "+" : "−"}
                  {formatAmount(r.amount, account?.currency ?? "")}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-faint">Next {formatDateShort(r.nextDueDate)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
