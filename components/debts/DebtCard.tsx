import Link from "next/link";
import type { Account, Debt } from "@/lib/types";
import { debtTotals } from "@/lib/selectors";
import { formatAmount, formatDateShort } from "@/lib/format";
import { Chip } from "@/components/ui/Chip";

const statusLabel = { outstanding: "Outstanding", partially_paid: "Partially paid", paid: "Paid" } as const;
const statusTone = { outstanding: "expense", partially_paid: "pending", paid: "income" } as const;

export function DebtCard({ debt, accounts, primaryCurrency, nextDue }: { debt: Debt; accounts: Account[]; primaryCurrency: string; nextDue?: string }) {
  const { principal, outstanding } = debtTotals(debt, accounts);
  const repaid = principal - outstanding;
  const pct = principal > 0 ? Math.min((repaid / principal) * 100, 100) : 0;
  const isPaid = debt.status === "paid";

  return (
    <Link href={`/debts/${debt.id}`} className={`block rounded-2xl border border-line bg-card p-3.5 ${isPaid ? "opacity-55" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`text-[14px] font-bold ${isPaid ? "line-through" : ""}`}>{debt.person}</div>
        <div className="shrink-0 text-right">
          <div className="tabular text-[15px] font-bold">{formatAmount(outstanding, primaryCurrency)}</div>
          <div className="tabular text-[10.5px] text-ink-faint">of {formatAmount(principal, primaryCurrency)}</div>
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
