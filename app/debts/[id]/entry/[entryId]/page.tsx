"use client";

import { use } from "react";
import { useCashierStore } from "@/lib/store";
import { DebtEntryForm } from "@/components/debts/DebtEntryForm";

export default function EditDebtEntryPage({ params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = use(params);
  const entry = useCashierStore((s) => s.debts.find((d) => d.id === id)?.entries.find((e) => e.id === entryId));

  if (!entry) return <p className="px-4 py-8 text-sm text-ink-faint">Entry not found.</p>;
  return <DebtEntryForm debtId={id} existing={entry} />;
}
