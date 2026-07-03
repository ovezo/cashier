"use client";

import { useMemo, useState } from "react";
import { useCashierStore } from "@/lib/store";
import { getPrimaryAccount } from "@/lib/currency";
import { categoryBreakdown, currentMonthBounds, monthBoundsOffset, periodTotals } from "@/lib/selectors";
import { formatAmount, todayIso } from "@/lib/format";
import { Segmented } from "@/components/ui/Segmented";
import { CategoryDonut } from "@/components/analytics/CategoryDonut";
import { CashFlowBars } from "@/components/analytics/CashFlowBars";
import type { TxType } from "@/lib/types";

type RangeOption = "this-month" | "last-month" | "custom";

export default function AnalyticsPage() {
  const transactions = useCashierStore((s) => s.transactions);
  const categories = useCashierStore((s) => s.categories);
  const accounts = useCashierStore((s) => s.accounts);
  const primary = getPrimaryAccount(accounts);

  const [range, setRange] = useState<RangeOption>("this-month");
  const [customFrom, setCustomFrom] = useState(currentMonthBounds().start);
  const [customTo, setCustomTo] = useState(todayIso());
  const [breakdownType, setBreakdownType] = useState<TxType>("expense");

  const { from, to } = useMemo(() => {
    if (range === "this-month") return { from: currentMonthBounds().start, to: currentMonthBounds().end };
    if (range === "last-month") return { from: monthBoundsOffset(-1).start, to: monthBoundsOffset(-1).end };
    return { from: customFrom, to: customTo };
  }, [range, customFrom, customTo]);

  const { incomePrimary, expensePrimary } = periodTotals(transactions, accounts, from, to);
  const total = incomePrimary + expensePrimary;
  const incomePct = total > 0 ? (incomePrimary / total) * 100 : 50;

  const { rows } = categoryBreakdown(transactions, categories, accounts, breakdownType, from, to);
  const topRow = rows[0];

  const cashFlowRows = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const { start, end } = monthBoundsOffset(-i);
      const totals = periodTotals(transactions, accounts, start, end);
      const label = new Date(start + "T00:00:00").toLocaleDateString(undefined, { month: "short" });
      out.push({ label, income: totals.incomePrimary, expense: totals.expensePrimary });
    }
    return out;
  }, [transactions, accounts]);

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="font-serif text-xl font-semibold">Analytics</h1>

      <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1">
        {(["this-month", "last-month", "custom"] as RangeOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setRange(opt)}
            className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] ${
              range === opt ? "bg-accent text-white" : "bg-paper-deep text-ink-soft"
            }`}
          >
            {opt === "this-month" ? "This month" : opt === "last-month" ? "Last month" : "Custom range"}
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

      <div className="mt-4 flex gap-2.5">
        <div className="flex-1 rounded-2xl border border-line bg-card p-3.5">
          <div className="text-[10.5px] uppercase tracking-wide text-ink-faint">Income</div>
          <div className="tabular mt-1 text-[17px] font-bold text-income">{formatAmount(incomePrimary, primary?.currency ?? "")}</div>
        </div>
        <div className="flex-1 rounded-2xl border border-line bg-card p-3.5">
          <div className="text-[10.5px] uppercase tracking-wide text-ink-faint">Expense</div>
          <div className="tabular mt-1 text-[17px] font-bold text-expense">{formatAmount(expensePrimary, primary?.currency ?? "")}</div>
        </div>
      </div>
      <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-paper-deep">
        <div className="h-full bg-income" style={{ width: `${incomePct}%` }} />
        <div className="h-full bg-expense" style={{ width: `${100 - incomePct}%` }} />
      </div>

      <div className="mt-5 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Cash flow · last 6 months</div>
      <div className="rounded-2xl border border-line bg-card p-3.5">
        <CashFlowBars rows={cashFlowRows} currency={primary?.currency ?? ""} />
        <div className="mt-2.5 flex gap-4 text-[11px] text-ink-soft">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-income" />Income</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-expense" />Expense</span>
        </div>
      </div>

      <div className="mt-5 mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Where it {breakdownType === "expense" ? "went" : "came from"}</span>
        <div className="w-[132px]">
          <Segmented
            value={breakdownType}
            onChange={setBreakdownType}
            options={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-card p-3.5">
        <CategoryDonut rows={rows} currency={primary?.currency ?? ""} />
        {topRow && (
          <div className="mt-3.5 rounded-xl bg-paper-deep p-2.5 text-[12.5px] leading-relaxed text-ink-soft">
            <b className="text-ink">{topRow.name}</b> is your biggest {breakdownType === "expense" ? "expense" : "income source"} this period at <b className="text-ink">{topRow.pct.toFixed(0)}%</b>.
          </div>
        )}
      </div>
    </div>
  );
}
