"use client";

import { useState } from "react";
import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { getPrimaryAccount, toPrimary } from "@/lib/currency";
import { formatAmount } from "@/lib/format";
import type { DebtDirection } from "@/lib/types";
import { Segmented } from "@/components/ui/Segmented";
import { DebtCard } from "@/components/debts/DebtCard";

export default function DebtsPage() {
  const debts = useCashierStore((s) => s.debts);
  const accounts = useCashierStore((s) => s.accounts);
  const rules = useCashierStore((s) => s.recurringRules);
  const [tab, setTab] = useState<DebtDirection>("owed_to_me");

  const primary = getPrimaryAccount(accounts);
  const filtered = debts.filter((d) => d.direction === tab).sort((a, b) => (a.status === "paid" ? 1 : 0) - (b.status === "paid" ? 1 : 0));

  const totalOutstandingPrimary = debts
    .filter((d) => d.direction === tab && d.status !== "paid")
    .reduce((sum, d) => {
      const repaid = d.repayments.reduce((s, r) => s + r.amount, 0);
      const outstanding = d.principal - repaid;
      const account = accounts.find((a) => a.id === d.accountId);
      return sum + toPrimary(outstanding, account);
    }, 0);

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Debts</h1>
        <Link href="/debts/new" className="text-[13px] font-semibold text-accent">
          + Add
        </Link>
      </div>

      <div className="mt-3.5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "owed_to_me", label: "Owed to me" },
            { value: "i_owe", label: "I owe" },
          ]}
        />
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
          {tab === "owed_to_me" ? "Total owed to you" : "Total you owe"}
        </div>
        <div className={`tabular mt-1 text-[26px] font-bold ${tab === "owed_to_me" ? "text-income" : "text-expense"}`}>
          {formatAmount(totalOutstandingPrimary, primary?.currency ?? "")}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {filtered.length === 0 && <p className="py-6 text-center text-[13px] text-ink-faint">No debts here yet.</p>}
        {filtered.map((d) => {
          const account = accounts.find((a) => a.id === d.accountId);
          const rule = rules.find((r) => r.id === d.recurringId);
          return <DebtCard key={d.id} debt={d} currency={account?.currency ?? ""} nextDue={rule?.active ? rule.nextDueDate : undefined} />;
        })}
      </div>
    </div>
  );
}
