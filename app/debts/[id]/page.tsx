"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { debtTotals, totalsByCurrency } from "@/lib/selectors";
import { getPrimaryAccount } from "@/lib/currency";
import { formatAmount } from "@/lib/format";
import { frequencyLabel } from "@/lib/recurring";
import { Chip } from "@/components/ui/Chip";
import { LinkButton } from "@/components/ui/LinkButton";
import { DebtHistoryRow } from "@/components/debts/DebtHistoryRow";

const statusLabel = { outstanding: "Outstanding", partially_paid: "Partially paid", paid: "Paid" } as const;
const statusTone = { outstanding: "expense", partially_paid: "pending", paid: "income" } as const;

export default function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const debt = useCashierStore((s) => s.debts.find((d) => d.id === id));
  const accounts = useCashierStore((s) => s.accounts);
  const rule = useCashierStore((s) => s.recurringRules.find((r) => r.id === debt?.recurringId));
  const deleteDebt = useCashierStore((s) => s.deleteDebt);
  const toggleRecurringActive = useCashierStore((s) => s.toggleRecurringActive);

  const primary = getPrimaryAccount(accounts);

  if (!debt) return <p className="px-4 py-8 text-sm text-ink-faint">Debt not found.</p>;

  const primaryCurrency = primary?.currency ?? "";
  const perCurrency = totalsByCurrency([debt], accounts, primaryCurrency);
  const primaryTotals = debtTotals(debt, accounts);
  const receivedLabel = debt.direction === "owed_to_me" ? "Received" : "Paid";

  // The overall outstanding (summed across the debt's currencies, in the primary
  // currency) expressed in each distinct currency the user holds an account in —
  // primary first. e.g. "≈ $1,525.56 or ₮5,448.43".
  const overallInEachCurrency: { currency: string; amount: number }[] = [];
  const seenCurrency = new Set<string>();
  for (const a of accounts) {
    if (seenCurrency.has(a.currency)) continue;
    seenCurrency.add(a.currency);
    overallInEachCurrency.push({
      currency: a.currency,
      amount: a.exchangeRateToPrimary ? primaryTotals.outstanding / a.exchangeRateToPrimary : primaryTotals.outstanding,
    });
  }
  overallInEachCurrency.sort((x, y) => (x.currency === primaryCurrency ? -1 : 0) - (y.currency === primaryCurrency ? -1 : 0));
  const overallText = overallInEachCurrency.map((c) => formatAmount(c.amount, c.currency)).join(" or ");
  // Only worth showing when it adds information: the user holds more than one
  // currency, or this debt isn't already all in the primary currency.
  const showOverall = seenCurrency.size > 1 || perCurrency.length > 1 || (perCurrency[0] && perCurrency[0].currency !== primaryCurrency);
  const lendLabel = debt.direction === "owed_to_me" ? "Lend more" : "Borrow more";
  const repaymentLabel = debt.direction === "owed_to_me" ? "Record received" : "Record repayment";

  // Entries only carry a day-level date, so two same-day entries can't be told apart by date
  // alone — reverse to most-recently-added-first, then stably sort by date descending so
  // newest activity is always on top, even among same-day entries.
  const history = [...debt.entries].reverse().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">{debt.person}</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip tone={statusTone[debt.status]}>{statusLabel[debt.status]}</Chip>
        <Chip tone="muted">{debt.direction === "owed_to_me" ? "Owed to me" : "I owe"}</Chip>
        {rule && <Chip tone="pending">Recurring · {frequencyLabel[rule.frequency]}</Chip>}
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-card p-3.5">
        {perCurrency.map((c, i) => (
          <div key={c.currency} className={i > 0 ? "mt-3 border-t border-line pt-3" : ""}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-faint">Outstanding{perCurrency.length > 1 ? ` · ${c.currency}` : ""}</span>
              <span className="tabular text-[17px] font-bold">{formatAmount(c.outstanding, c.currency)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[13px]">
              <span className="text-ink-faint">Principal</span>
              <span className="tabular font-semibold">{formatAmount(c.principal, c.currency)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[13px]">
              <span className="text-ink-faint">{receivedLabel} so far</span>
              <span className="tabular font-semibold text-income">{formatAmount(c.repaid, c.currency)}</span>
            </div>
          </div>
        ))}
        {showOverall && (
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink-faint">
            Overall ≈ {overallText} <span className="text-ink-faint">(in the currencies in your accounts).</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2.5">
        {debt.status !== "paid" && (
          <LinkButton href={`/debts/${debt.id}/repayment`}>{repaymentLabel}</LinkButton>
        )}
        <LinkButton href={`/debts/${debt.id}/lend`} variant="outline">
          {lendLabel}
        </LinkButton>
      </div>

      {rule && (
        <button
          onClick={() => toggleRecurringActive(rule.id)}
          className="mt-3 w-full rounded-xl bg-paper-deep px-4 py-3 text-[13px] font-semibold text-ink"
        >
          {rule.active ? "Pause recurring instalments" : "Resume recurring instalments"}
        </button>
      )}

      <div className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">History</div>
      {history.map((e) => (
        <DebtHistoryRow key={e.id} debtId={debt.id} entry={e} account={accounts.find((a) => a.id === e.accountId)} />
      ))}

      <button
        onClick={() => {
          deleteDebt(debt.id);
          router.push(`/debts?tab=${debt.direction}`);
        }}
        className="mt-6 w-full text-center text-[13px] font-semibold text-expense"
      >
        Delete debt
      </button>
    </div>
  );
}
