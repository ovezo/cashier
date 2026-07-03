"use client";

import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { formatAmount, formatSigned } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function TransactionRow({ tx }: { tx: Transaction }) {
  const account = useCashierStore((s) => s.accounts.find((a) => a.id === tx.accountId));
  const toAccount = useCashierStore((s) => (tx.toAccountId ? s.accounts.find((a) => a.id === tx.toAccountId) : undefined));
  const allCategories = useCashierStore((s) => s.categories);
  const debt = useCashierStore((s) => (tx.linkedDebtId ? s.debts.find((d) => d.id === tx.linkedDebtId) : undefined));
  const txCategories = (tx.categoryIds ?? []).map((id) => allCategories.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (tx.type === "transfer") {
    return (
      <Link href={`/transactions/${tx.id}`} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-b-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-[16px]">🔁</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold">{tx.note || "Transfer"}</div>
          <div className="truncate text-[11.5px] text-ink-faint">
            {account?.name} → {toAccount?.name}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="tabular text-[13.5px] font-semibold text-accent">
            −{formatAmount(tx.amount, account?.currency ?? "")}
          </div>
          <div className="mt-0.5 tabular text-[10px] text-ink-faint">+{formatAmount(tx.toAmount ?? tx.amount, toAccount?.currency ?? "")}</div>
        </div>
      </Link>
    );
  }

  const label = txCategories.length > 0 ? txCategories.map((c) => c.name).join(" · ") : debt ? `Debt · ${debt.person}` : "Uncategorised";
  const icon = txCategories[0]?.icon ?? "🤝";

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
