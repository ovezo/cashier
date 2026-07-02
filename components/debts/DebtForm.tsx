"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { sanitizeDecimalInput, todayIso } from "@/lib/format";
import { frequencyLabel } from "@/lib/recurring";
import type { DebtDirection, Frequency } from "@/lib/types";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Label, SelectInput, TextInput } from "@/components/ui/Field";

const frequencies: Frequency[] = ["daily", "weekly", "biweekly", "monthly", "yearly"];

export function DebtForm() {
  const router = useRouter();
  const accounts = useCashierStore((s) => s.accounts);
  const addDebt = useCashierStore((s) => s.addDebt);
  const addRecurringRule = useCashierStore((s) => s.addRecurringRule);
  const updateDebt = useCashierStore((s) => s.updateDebt);

  const [direction, setDirection] = useState<DebtDirection>("owed_to_me");
  const [person, setPerson] = useState("");
  const [principal, setPrincipal] = useState("");
  const [accountId, setAccountId] = useState(accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [instalment, setInstalment] = useState("");

  function submit() {
    const principalNum = parseFloat(principal);
    if (!person.trim() || !principalNum || principalNum <= 0 || !accountId) return;

    const debtId = addDebt({ direction, person: person.trim(), principal: principalNum, accountId, note });

    if (recurring) {
      const instalmentNum = parseFloat(instalment) || principalNum;
      const ruleId = addRecurringRule({
        kind: "debt",
        frequency,
        startDate: todayIso(),
        nextDueDate: todayIso(),
        amount: instalmentNum,
        accountId,
        note: `Instalment · ${person.trim()}`,
        active: true,
        linkedDebtId: debtId,
      });
      updateDebt(debtId, { recurringId: ruleId });
    }

    router.push("/debts");
  }

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">Add debt</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>

      <div className="mt-3.5">
        <Segmented
          value={direction}
          onChange={setDirection}
          options={[
            { value: "owed_to_me", label: "Owed to me" },
            { value: "i_owe", label: "I owe" },
          ]}
        />
      </div>

      <div className="mt-4">
        <Label>Person</Label>
        <TextInput value={person} onChange={(e) => setPerson(e.target.value)} placeholder="e.g. Elif Yıldız" />
      </div>

      <div className="mt-4">
        <Label>Principal amount</Label>
        <TextInput inputMode="decimal" value={principal} onChange={(e) => setPrincipal(sanitizeDecimalInput(e.target.value))} placeholder="0.00" />
      </div>

      <div className="mt-4">
        <Label>Currency / account</Label>
        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="mt-4">
        <Label>Note</Label>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for? (optional)" />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[13.5px] font-semibold">Recurring instalments</span>
        <Switch checked={recurring} onChange={setRecurring} />
      </div>

      {recurring && (
        <div className="mt-3 flex flex-col gap-2.5">
          <div>
            <Label>Instalment amount</Label>
            <TextInput inputMode="decimal" value={instalment} onChange={(e) => setInstalment(sanitizeDecimalInput(e.target.value))} placeholder={principal || "0.00"} />
          </div>
          <div>
            <Label>Frequency</Label>
            <SelectInput value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              {frequencies.map((f) => (
                <option key={f} value={f}>
                  {frequencyLabel[f]}
                </option>
              ))}
            </SelectInput>
          </div>
          <p className="text-[11.5px] leading-relaxed text-ink-faint">
            Each cycle creates a pending entry you&apos;ll confirm manually as paid or received.
          </p>
        </div>
      )}

      <div className="mt-6">
        <Button onClick={submit}>Add debt</Button>
      </div>
    </div>
  );
}
