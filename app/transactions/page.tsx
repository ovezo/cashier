"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { TransactionList } from "@/components/transactions/TransactionList";
import { SelectInput } from "@/components/ui/Field";
import { toDateIso, todayIso } from "@/lib/format";

type RangeOption = "all" | "this-month" | "last-month" | "custom";

function monthBounds(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start: toDateIso(start), end: toDateIso(end) };
}

export default function TransactionsPage() {
  const transactions = useCashierStore((s) => s.transactions);
  const categories = useCashierStore((s) => s.categories);
  const accounts = useCashierStore((s) => s.accounts);

  const [range, setRange] = useState<RangeOption>("this-month");
  const [customFrom, setCustomFrom] = useState(monthBounds(0).start);
  const [customTo, setCustomTo] = useState(todayIso());
  const [categoryId, setCategoryId] = useState("all");
  const [accountId, setAccountId] = useState("all");

  const filtered = useMemo(() => {
    let from = "0000-01-01";
    let to = "9999-12-31";
    if (range === "this-month") ({ start: from, end: to } = monthBounds(0));
    if (range === "last-month") ({ start: from, end: to } = monthBounds(-1));
    if (range === "custom") {
      from = customFrom;
      to = customTo;
    }
    return transactions.filter((t) => {
      if (t.status !== "confirmed") return false;
      if (t.date < from || t.date > to) return false;
      if (categoryId !== "all" && !t.categoryIds?.includes(categoryId)) return false;
      if (accountId !== "all" && t.accountId !== accountId && t.toAccountId !== accountId) return false;
      return true;
    });
  }, [transactions, range, customFrom, customTo, categoryId, accountId]);

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Transactions</h1>
        <Link href="/add" className="text-[13px] font-semibold text-accent">
          + Add
        </Link>
      </div>

      <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1">
        {(["this-month", "last-month", "all", "custom"] as RangeOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setRange(opt)}
            className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] ${
              range === opt ? "bg-accent text-white" : "bg-paper-deep text-ink-soft"
            }`}
          >
            {opt === "this-month" ? "This month" : opt === "last-month" ? "Last month" : opt === "all" ? "All time" : "Custom"}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="mt-2.5 flex items-center gap-2">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-full rounded-lg border border-line bg-card px-2.5 py-2 text-base" />
          <span className="text-ink-faint">–</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-full rounded-lg border border-line bg-card px-2.5 py-2 text-base" />
        </div>
      )}

      <div className="mt-2.5 flex gap-2">
        <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="text-xs">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)} className="text-xs">
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectInput>
      </div>

      <TransactionList transactions={filtered} />
    </div>
  );
}
