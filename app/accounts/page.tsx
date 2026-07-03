"use client";

import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { accountBalance } from "@/lib/selectors";
import { formatAmount } from "@/lib/format";

export default function AccountsPage() {
  const accounts = useCashierStore((s) => s.accounts);
  const transactions = useCashierStore((s) => s.transactions);
  const primary = accounts.find((a) => a.isPrimary);

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Accounts</h1>
        <Link href="/accounts/new" className="text-[13px] font-semibold text-accent">
          + Add
        </Link>
      </div>
      <p className="mt-1.5 text-[12.5px] text-ink-faint">All totals and overviews are shown in your primary currency, {primary?.currency}.</p>

      <div className="mt-4 flex flex-col gap-2.5">
        {accounts.map((a) => (
          <Link key={a.id} href={`/accounts/${a.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-card p-3.5">
            <div>
              <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                {a.isPrimary && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                {a.name}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                {a.currency} {!a.isPrimary && `· 1 ${a.currency} = ${a.exchangeRateToPrimary} ${primary?.currency}`}
              </div>
            </div>
            <div className="tabular text-[14px] font-semibold">{formatAmount(accountBalance(a, transactions), a.currency)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
