"use client";

import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { formatSigned } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function TransactionRow({ tx }: { tx: Transaction }) {
  const account = useCashierStore((s) => s.accounts.find((a) => a.id === tx.accountId));
  const category = useCashierStore((s) => s.categories.find((c) => c.id === tx.categoryId));
  const debt = useCashierStore((s) => (tx.linkedDebtId ? s.debts.find((d) => d.id === tx.linkedDebtId) : undefined));

  const label = category?.name ?? (debt ? `Debt · ${debt.person}` : "Uncategorised");
  const icon = category?.icon ?? "🤝";

  return (
    <Link href={`/transactions/${tx.id}`} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-paper-deep text-[16px]">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">{tx.note || label}</div>
        <div className="truncate text-[11.5px] text-ink-faint">{label}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`tabular text-[13.5px] font-semibold ${tx.type === "income" ? "text-income" : "text-expense"}`}>
          {formatSigned(tx.amount, account?.currency ?? "", tx.type)}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-ink-faint">{account?.currency}</div>
      </div>
    </Link>
  );
}
