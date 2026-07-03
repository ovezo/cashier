"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { formatAmount, formatDate } from "@/lib/format";
import type { Account, DebtEntry } from "@/lib/types";

export function DebtHistoryRow({ debtId, entry, account }: { debtId: string; entry: DebtEntry; account?: Account }) {
  const [open, setOpen] = useState(false);
  const deleteDebtEntry = useCashierStore((s) => s.deleteDebtEntry);
  const markDebtEntryPaid = useCashierStore((s) => s.markDebtEntryPaid);

  const isLend = entry.kind === "lend";
  const isSettled = isLend && entry.paid;

  return (
    <div className="border-b border-line py-2.5 last:border-b-0">
      <div className="flex items-center justify-between text-[13px]">
        <span className={isSettled ? "text-ink-faint/60" : "text-ink-faint"}>{formatDate(entry.date)}</span>
        <div className="flex items-center gap-2">
          <span
            className={`tabular font-semibold ${
              isSettled ? "text-ink-faint/60 line-through" : isLend ? "text-ink" : "text-income"
            }`}
          >
            {isLend ? "+" : "−"}
            {formatAmount(entry.amount, account?.currency ?? "")}
          </span>
          <button aria-label="Entry options" onClick={() => setOpen((v) => !v)} className="text-ink-faint">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
      {entry.note && (
        <div className={`mt-0.5 text-[11.5px] ${isSettled ? "text-ink-faint/60 line-through" : "text-ink-faint"}`}>{entry.note}</div>
      )}

      {open && (
        <div className="mt-2.5 flex gap-2">
          <Link
            href={`/debts/${debtId}/entry/${entry.id}`}
            className="flex-1 rounded-lg border border-line bg-card py-2 text-center text-[11.5px] font-semibold text-ink"
          >
            Edit
          </Link>
          {isLend && !entry.paid && (
            <button
              onClick={() => {
                markDebtEntryPaid(debtId, entry.id);
                setOpen(false);
              }}
              className="flex-1 rounded-lg border border-line bg-card py-2 text-center text-[11.5px] font-semibold text-income"
            >
              Mark paid
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Delete this history entry? This also removes its linked transaction.")) {
                deleteDebtEntry(debtId, entry.id);
              }
            }}
            className="flex-1 rounded-lg border border-line bg-card py-2 text-center text-[11.5px] font-semibold text-expense"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
