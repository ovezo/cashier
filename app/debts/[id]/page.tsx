"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { formatAmount, formatDate, sanitizeDecimalInput, todayIso } from "@/lib/format";
import { frequencyLabel } from "@/lib/recurring";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

const statusLabel = { outstanding: "Outstanding", partially_paid: "Partially paid", paid: "Paid" } as const;
const statusTone = { outstanding: "expense", partially_paid: "pending", paid: "income" } as const;

export default function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const debt = useCashierStore((s) => s.debts.find((d) => d.id === id));
  const account = useCashierStore((s) => s.accounts.find((a) => a.id === debt?.accountId));
  const rule = useCashierStore((s) => s.recurringRules.find((r) => r.id === debt?.recurringId));
  const addRepayment = useCashierStore((s) => s.addRepayment);
  const deleteDebt = useCashierStore((s) => s.deleteDebt);
  const toggleRecurringActive = useCashierStore((s) => s.toggleRecurringActive);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());

  if (!debt) return <p className="px-4 py-8 text-sm text-ink-faint">Debt not found.</p>;

  const repaid = debt.repayments.reduce((s, r) => s + r.amount, 0);
  const outstanding = Math.max(debt.principal - repaid, 0);
  const currency = account?.currency ?? "";
  const verb = debt.direction === "owed_to_me" ? "received" : "paid";

  function submitRepayment() {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    addRepayment(debt!.id, num, date);
    setAmount("");
  }

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">{debt.person}</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>
      {debt.note && <p className="mt-1 text-[12.5px] text-ink-faint">{debt.note}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip tone={statusTone[debt.status]}>{statusLabel[debt.status]}</Chip>
        <Chip tone="muted">{debt.direction === "owed_to_me" ? "Owed to me" : "I owe"}</Chip>
        {rule && <Chip tone="pending">Recurring · {frequencyLabel[rule.frequency]}</Chip>}
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-card p-3.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-ink-faint">Outstanding</span>
          <span className="tabular text-[17px] font-bold">{formatAmount(outstanding, currency)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[13px]">
          <span className="text-ink-faint">Principal</span>
          <span className="tabular font-semibold">{formatAmount(debt.principal, currency)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[13px]">
          <span className="text-ink-faint">{debt.direction === "owed_to_me" ? "Received" : "Paid"} so far</span>
          <span className="tabular font-semibold text-income">{formatAmount(repaid, currency)}</span>
        </div>
      </div>

      {debt.status !== "paid" && (
        <div className="mt-4">
          <Label>Record a {verb} amount</Label>
          <div className="flex gap-2">
            <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))} placeholder="0.00" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-line bg-card px-2.5 text-xs" />
          </div>
          <div className="mt-2.5">
            <Button variant="outline" onClick={submitRepayment}>
              Add repayment
            </Button>
          </div>
        </div>
      )}

      {rule && (
        <button
          onClick={() => toggleRecurringActive(rule.id)}
          className="mt-4 w-full rounded-xl bg-paper-deep px-4 py-3 text-[13px] font-semibold text-ink"
        >
          {rule.active ? "Pause recurring instalments" : "Resume recurring instalments"}
        </button>
      )}

      <div className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Repayment history</div>
      {debt.repayments.length === 0 && <p className="text-[13px] text-ink-faint">No repayments recorded yet.</p>}
      {[...debt.repayments].sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => (
        <div key={r.id} className="flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-b-0">
          <span className="text-ink-faint">{formatDate(r.date)}</span>
          <span className="tabular font-semibold text-income">{formatAmount(r.amount, currency)}</span>
        </div>
      ))}

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
