"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCashierStore } from "@/lib/store";
import { getPrimaryAccount } from "@/lib/currency";
import { debtTotals } from "@/lib/selectors";
import { formatAmount } from "@/lib/format";
import type { DebtDirection } from "@/lib/types";
import { Segmented } from "@/components/ui/Segmented";
import { DebtCard } from "@/components/debts/DebtCard";

export default function DebtsPage() {
  return (
    <Suspense>
      <DebtsPageContent />
    </Suspense>
  );
}

function DebtsPageContent() {
  const debts = useCashierStore((s) => s.debts);
  const accounts = useCashierStore((s) => s.accounts);
  const rules = useCashierStore((s) => s.recurringRules);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: DebtDirection = searchParams.get("tab") === "i_owe" ? "i_owe" : "owed_to_me";

  const primary = getPrimaryAccount(accounts);
  const filtered = debts.filter((d) => d.direction === tab).sort((a, b) => (a.status === "paid" ? 1 : 0) - (b.status === "paid" ? 1 : 0));

  const totalOutstandingPrimary = debts
    .filter((d) => d.direction === tab && d.status !== "paid")
    .reduce((sum, d) => sum + debtTotals(d, accounts).outstanding, 0);

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">Debts</h1>
        <Link href={`/debts/new?direction=${tab}`} className="text-[13px] font-semibold text-accent">
          + Add
        </Link>
      </div>

      <div className="mt-3.5">
        <Segmented
          value={tab}
          onChange={(v) => router.replace(`/debts?tab=${v}`, { scroll: false })}
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
          const rule = rules.find((r) => r.id === d.recurringId);
          return (
            <DebtCard
              key={d.id}
              debt={d}
              accounts={accounts}
              primaryCurrency={primary?.currency ?? ""}
              nextDue={rule?.active ? rule.nextDueDate : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
