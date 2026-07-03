"use client";

import { useCashierStore } from "@/lib/store";
import { formatAmount, formatDate, todayIso } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function PendingCard({ tx }: { tx: Transaction }) {
  const account = useCashierStore((s) => s.accounts.find((a) => a.id === tx.accountId));
  const firstCategory = useCashierStore((s) => s.categories.find((c) => c.id === tx.categoryIds?.[0]));
  const debt = useCashierStore((s) => (tx.linkedDebtId ? s.debts.find((d) => d.id === tx.linkedDebtId) : undefined));
  const confirmTransaction = useCashierStore((s) => s.confirmTransaction);
  const skipTransaction = useCashierStore((s) => s.skipTransaction);

  const label = tx.note || firstCategory?.name || (debt ? `Instalment · ${debt.person}` : "Recurring item");
  const overdue = tx.date < todayIso();
  const confirmLabel = tx.type === "income" ? "Confirm received" : "Confirm paid";

  return (
    <div className="mt-2.5 rounded-2xl border border-[#E7D6A2] bg-pending-soft p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13.5px] font-bold">{label}</div>
          <div className="mt-0.5 text-[11px] text-[#8C6A16]">
            {overdue ? "Overdue since " : "Due "}
            {formatDate(tx.date)} · {account?.name}
          </div>
        </div>
        <div className={`tabular shrink-0 text-[15px] font-semibold ${tx.type === "income" ? "text-income" : "text-expense"}`}>
          {tx.type === "income" ? "+" : "−"}
          {formatAmount(tx.amount, account?.currency ?? "")}
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button onClick={() => confirmTransaction(tx.id)} className="flex-1 rounded-[9px] bg-accent py-2.5 text-[12px] font-bold text-white">
          {confirmLabel}
        </button>
        <button onClick={() => skipTransaction(tx.id)} className="flex-1 rounded-[9px] border border-line bg-white py-2.5 text-[12px] font-bold text-ink-soft">
          Skip
        </button>
      </div>
    </div>
  );
}
