import Link from "next/link";
import type { Account, Debt } from "@/lib/types";
import { debtTotals, totalsByCurrency } from "@/lib/selectors";
import { formatAmount, formatDateShort } from "@/lib/format";
import { Chip } from "@/components/ui/Chip";

const statusLabel = { outstanding: "Outstanding", partially_paid: "Partially paid", paid: "Paid" } as const;
const statusTone = { outstanding: "expense", partially_paid: "pending", paid: "income" } as const;

export function DebtCard({ debt, accounts, primaryCurrency, nextDue }: { debt: Debt; accounts: Account[]; primaryCurrency: string; nextDue?: string }) {
  // Progress is a single bar across the whole debt, so pct is computed in the primary currency;
  // the displayed amounts stay in each entry's own currency (no conversion).
  const { principal, outstanding } = debtTotals(debt, accounts);
  const pct = principal > 0 ? Math.min(((principal - outstanding) / principal) * 100, 100) : 0;
  const perCurrency = totalsByCurrency([debt], accounts, primaryCurrency);
  const isPaid = debt.status === "paid";

  return (
    <Link href={`/debts/${debt.id}`} className={`block rounded-2xl border border-line bg-card p-3.5 ${isPaid ? "opacity-55" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`min-w-0 flex-1 truncate text-[14px] font-bold ${isPaid ? "line-through" : ""}`}>{debt.person}</div>
        <div className="flex shrink-0 items-start gap-2">
          {perCurrency.map((c, i) => (
            <div key={c.currency} className="flex items-start gap-2">
              {i > 0 && <span className="pt-px text-[13px] font-bold text-ink-faint">+</span>}
              <div className="text-right">
                <div className="tabular text-[15px] font-bold leading-tight">{formatAmount(c.outstanding, c.currency)}</div>
                <div className="tabular text-[10.5px] text-ink-faint">of {formatAmount(c.principal, c.currency)}</div>
              </div>
            </div>
          ))}
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
