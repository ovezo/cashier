"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { getPrimaryAccount } from "@/lib/currency";
import { sanitizeDecimalInput, todayIso } from "@/lib/format";
import type { DebtEntry, DebtEntryKind } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Label, SelectInput, TextInput } from "@/components/ui/Field";

export function DebtEntryForm({ debtId, kind, existing }: { debtId: string; kind?: DebtEntryKind; existing?: DebtEntry }) {
  const router = useRouter();
  const debt = useCashierStore((s) => s.debts.find((d) => d.id === debtId));
  const accounts = useCashierStore((s) => s.accounts);
  const addDebtEntry = useCashierStore((s) => s.addDebtEntry);
  const updateDebtEntry = useCashierStore((s) => s.updateDebtEntry);

  const entryKind = existing?.kind ?? kind ?? "repayment";
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [accountId, setAccountId] = useState(existing?.accountId ?? "");
  const [date, setDate] = useState(existing?.date ?? todayIso());
  const [note, setNote] = useState(existing?.note ?? "");

  const primary = getPrimaryAccount(accounts);
  const resolvedAccountId = accounts.some((a) => a.id === accountId) ? accountId : primary?.id ?? "";

  if (!debt) return <p className="px-4 py-8 text-sm text-ink-faint">Debt not found.</p>;

  const isLend = entryKind === "lend";
  const title = existing
    ? "Edit entry"
    : isLend
      ? debt.direction === "owed_to_me"
        ? "Lend more"
        : "Borrow more"
      : debt.direction === "owed_to_me"
        ? "Record received"
        : "Record repayment";

  function submit() {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !resolvedAccountId) return;
    if (existing) {
      updateDebtEntry(debtId, existing.id, { amount: num, accountId: resolvedAccountId, date, note: note.trim() });
    } else {
      addDebtEntry(debtId, { kind: entryKind, amount: num, accountId: resolvedAccountId, date, note: note.trim() });
    }
    router.back();
  }

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>
      <p className="mt-1 text-[12.5px] text-ink-faint">{debt.person}</p>

      <div className="mt-4">
        <Label>Amount</Label>
        <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))} placeholder="0.00" autoFocus />
      </div>

      <div className="mt-4">
        <Label>Wallet</Label>
        <SelectInput value={resolvedAccountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="mt-4">
        <Label>Date</Label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-line bg-card px-3.5 py-3 text-base text-ink focus:border-accent focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <Label>Note</Label>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
      </div>

      <div className="mt-6">
        <Button onClick={submit}>{existing ? "Save changes" : title}</Button>
      </div>
    </div>
  );
}
