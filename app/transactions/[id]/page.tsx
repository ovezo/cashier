"use client";

import { use } from "react";
import { useCashierStore } from "@/lib/store";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const transaction = useCashierStore((s) => s.transactions.find((t) => t.id === id));

  if (!transaction) {
    return <p className="px-4 py-8 text-sm text-ink-faint">Transaction not found.</p>;
  }
  return <TransactionForm existing={transaction} />;
}
