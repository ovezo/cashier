"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { sanitizeDecimalInput, todayIso } from "@/lib/format";
import { frequencyLabel } from "@/lib/recurring";
import type { Frequency, TxType } from "@/lib/types";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Label, SelectInput, TextInput } from "@/components/ui/Field";

const frequencies: Frequency[] = ["daily", "weekly", "biweekly", "monthly", "yearly"];

export function RecurringForm() {
  const router = useRouter();
  const accounts = useCashierStore((s) => s.accounts);
  const categories = useCashierStore((s) => s.categories);
  const addRecurringRule = useCashierStore((s) => s.addRecurringRule);
  const generatePending = useCashierStore((s) => s.generatePending);

  const [txType, setTxType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState(todayIso());

  // `accounts` is empty until hydration + seeding finish (both async). Resolve the default at
  // render time so it self-heals the moment real data arrives, rather than capturing whatever
  // was in the store at mount time.
  const resolvedAccountId = accounts.some((a) => a.id === accountId)
    ? accountId
    : accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id ?? "";

  const categoriesForType = useMemo(() => categories.filter((c) => c.type === txType), [categories, txType]);

  function submit() {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !resolvedAccountId) return;
    addRecurringRule({
      kind: "transaction",
      frequency,
      startDate,
      nextDueDate: startDate,
      amount: num,
      accountId: resolvedAccountId,
      categoryId: categoryId || undefined,
      note,
      active: true,
      txType,
    });
    generatePending();
    router.push("/recurring");
  }

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">New recurring rule</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>

      <div className="mt-3.5">
        <Segmented
          value={txType}
          onChange={(v) => {
            setTxType(v);
            setCategoryId("");
          }}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />
      </div>

      <div className="mt-4">
        <Label>Amount per cycle</Label>
        <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))} placeholder="0.00" />
      </div>

      <div className="mt-4">
        <Label>Account</Label>
        <SelectInput value={resolvedAccountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="mt-4">
        <Label>Category</Label>
        <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">No category</option>
          {categoriesForType.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="mt-4">
        <Label>Name / note</Label>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rent, Salary, Netflix" />
      </div>

      <div className="mt-4 flex gap-2.5">
        <div className="flex-1">
          <Label>Frequency</Label>
          <SelectInput value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {frequencies.map((f) => (
              <option key={f} value={f}>
                {frequencyLabel[f]}
              </option>
            ))}
          </SelectInput>
        </div>
        <div className="flex-1">
          <Label>Start date</Label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-line bg-card px-3.5 py-3 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
        Each cycle creates a pending entry you&apos;ll confirm manually as paid or received — nothing posts automatically.
      </p>

      <div className="mt-6">
        <Button onClick={submit}>Create rule</Button>
      </div>
    </div>
  );
}
