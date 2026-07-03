"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { debtTotals } from "@/lib/selectors";
import { getPrimaryAccount } from "@/lib/currency";
import { formatAmount, formatDate } from "@/lib/format";
import { frequencyLabel } from "@/lib/recurring";
import { Chip } from "@/components/ui/Chip";
import { LinkButton } from "@/components/ui/LinkButton";

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

  const { principal, repaid, outstanding } = debtTotals(debt, accounts);
  const primaryCurrency = primary?.currency ?? "";
  const lendLabel = debt.direction === "owed_to_me" ? "Lend more" : "Borrow more";
  const repaymentLabel = debt.direction === "owed_to_me" ? "Record received" : "Record repayment";

  const history = [...debt.entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

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
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-ink-faint">Outstanding</span>
          <span className="tabular text-[17px] font-bold">{formatAmount(outstanding, primaryCurrency)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[13px]">
          <span className="text-ink-faint">Principal</span>
          <span className="tabular font-semibold">{formatAmount(principal, primaryCurrency)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[13px]">
          <span className="text-ink-faint">{debt.direction === "owed_to_me" ? "Received" : "Paid"} so far</span>
          <span className="tabular font-semibold text-income">{formatAmount(repaid, primaryCurrency)}</span>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">Shown in your primary currency — entries can each be in a different wallet.</p>
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
      {history.map((e) => {
        const entryAccount = accounts.find((a) => a.id === e.accountId);
        const isLend = e.kind === "lend";
        return (
          <div key={e.id} className="border-b border-line py-2.5 last:border-b-0">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-faint">{formatDate(e.date)}</span>
              <span className={`tabular font-semibold ${isLend ? "text-ink" : "text-income"}`}>
                {isLend ? "+" : "−"}
                {formatAmount(e.amount, entryAccount?.currency ?? "")}
              </span>
            </div>
            {e.note && <div className="mt-0.5 text-[11.5px] text-ink-faint">{e.note}</div>}
          </div>
        );
      })}

      <button
        onClick={() => {
          deleteDebt(debt.id);
          router.push("/debts");
        }}
        className="mt-6 w-full text-center text-[13px] font-semibold text-expense"
      >
        Delete debt
      </button>
    </div>
  );
}
