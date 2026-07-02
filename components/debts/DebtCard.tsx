import Link from "next/link";
import type { Debt } from "@/lib/types";
import { formatAmount, formatDateShort } from "@/lib/format";
import { Chip } from "@/components/ui/Chip";

const statusLabel = { outstanding: "Outstanding", partially_paid: "Partially paid", paid: "Paid" } as const;
const statusTone = { outstanding: "expense", partially_paid: "pending", paid: "income" } as const;

export function DebtCard({ debt, currency, nextDue }: { debt: Debt; currency: string; nextDue?: string }) {
  const repaid = debt.repayments.reduce((s, r) => s + r.amount, 0);
  const outstanding = Math.max(debt.principal - repaid, 0);
  const pct = debt.principal > 0 ? Math.min((repaid / debt.principal) * 100, 100) : 0;
  const isPaid = debt.status === "paid";

  return (
    <Link href={`/debts/${debt.id}`} className={`block rounded-2xl border border-line bg-card p-3.5 ${isPaid ? "opacity-55" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`text-[14px] font-bold ${isPaid ? "line-through" : ""}`}>{debt.person}</div>
          {debt.note && <div className="mt-0.5 text-[11.5px] text-ink-faint">{debt.note}</div>}
        </div>
        <div className="shrink-0 text-right">
          <div className="tabular text-[15px] font-bold">{formatAmount(outstanding, currency)}</div>
          <div className="tabular text-[10.5px] text-ink-faint">of {formatAmount(debt.principal, currency)}</div>
        </div>
      </div>
      <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-paper-deep">
        <div className="h-full rounded-full bg-income" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Chip tone={statusTone[debt.status]}>{statusLabel[debt.status]}</Chip>
        {debt.recurringId && <Chip tone="pending">Recurring</Chip>}
        {nextDue && debt.status !== "paid" && <Chip tone="muted">Next due {formatDateShort(nextDue)}</Chip>}
      </div>
    </Link>
  );
}
