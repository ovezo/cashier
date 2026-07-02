import type { Transaction } from "@/lib/types";
import { relativeDayLabel } from "@/lib/format";
import { TransactionRow } from "./TransactionRow";

export function TransactionList({ transactions, emptyLabel = "No transactions yet." }: { transactions: Transaction[]; emptyLabel?: string }) {
  if (transactions.length === 0) {
    return <p className="py-6 text-center text-[13px] text-ink-faint">{emptyLabel}</p>;
  }

  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const groups = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    const label = relativeDayLabel(tx.date);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(tx);
  }

  return (
    <div>
      {[...groups.entries()].map(([label, txs]) => (
        <div key={label}>
          <div className="mt-3 mb-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
          {txs.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      ))}
    </div>
  );
}
