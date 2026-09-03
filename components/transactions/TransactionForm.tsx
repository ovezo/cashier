"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { useCommit } from "@/lib/useCommit";
import { currencySymbol, sanitizeDecimalInput, todayIso } from "@/lib/format";
import { frequencyLabel } from "@/lib/recurring";
import { crossRate } from "@/lib/currency";
import type { Frequency, Transaction, TransactionType } from "@/lib/types";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SelectInput } from "@/components/ui/Field";
import { CategoryPicker } from "@/components/categories/CategoryPicker";

const frequencies: Frequency[] = ["daily", "weekly", "biweekly", "monthly", "yearly"];

const typeAccent: Record<TransactionType, string> = {
  expense: "text-expense",
  income: "text-income",
  transfer: "text-accent",
};

export function TransactionForm({ existing }: { existing?: Transaction }) {
  const router = useRouter();
  const accounts = useCashierStore((s) => s.accounts);
  const categories = useCashierStore((s) => s.categories);
  const addTransaction = useCashierStore((s) => s.addTransaction);
  const updateTransaction = useCashierStore((s) => s.updateTransaction);
  const deleteTransaction = useCashierStore((s) => s.deleteTransaction);
  const addRecurringRule = useCashierStore((s) => s.addRecurringRule);
  const generatePending = useCashierStore((s) => s.generatePending);
  const { commit, saving } = useCommit();
  const [error, setError] = useState("");

  const [type, setType] = useState<TransactionType>(existing?.type ?? "expense");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [accountId, setAccountId] = useState(existing?.accountId ?? "");
  const [toAccountId, setToAccountId] = useState(existing?.toAccountId ?? "");
  const [manualRate, setManualRate] = useState(existing?.type === "transfer" && existing.amount ? String(existing.toAmount! / existing.amount) : "");
  const [rateTouched, setRateTouched] = useState(Boolean(existing));
  const [categoryIds, setCategoryIds] = useState<string[]>(existing?.categoryIds ?? []);
  const [date, setDate] = useState(existing?.date ?? todayIso());
  const [note, setNote] = useState(existing?.note ?? "");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  // `accounts` is empty until hydration + seeding finish (both async). Rather than capturing
  // whatever was in the store at mount time, resolve the default at render time so it
  // self-heals the moment real data arrives — same idea as `resolvedToAccountId` below.
  const resolvedAccountId = accounts.some((a) => a.id === accountId)
    ? accountId
    : accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id ?? "";
  const account = accounts.find((a) => a.id === resolvedAccountId);

  const toOptions = accounts.filter((a) => a.id !== resolvedAccountId);
  const resolvedToAccountId = toOptions.some((a) => a.id === toAccountId) ? toAccountId : toOptions[0]?.id ?? "";
  const toAccount = accounts.find((a) => a.id === resolvedToAccountId);

  const rate = rateTouched ? manualRate : String(crossRate(account, toAccount));
  const sendAmount = parseFloat(amount) || 0;
  const rateNum = parseFloat(rate) || 0;
  const receiveAmount = sendAmount * rateNum;

  async function run(mutate: () => void, navigate: () => void) {
    setError("");
    const ok = await commit(mutate);
    if (ok) navigate();
    else setError("Couldn't save — check your connection and try again.");
  }

  function submit() {
    if (type === "transfer") {
      if (!sendAmount || sendAmount <= 0 || !rateNum || rateNum <= 0 || !resolvedAccountId || !resolvedToAccountId) return;
      const payload = {
        type: "transfer" as const,
        amount: sendAmount,
        accountId: resolvedAccountId,
        toAccountId: resolvedToAccountId,
        toAmount: receiveAmount,
        note,
        date,
        categoryIds: undefined,
      };
      if (existing) {
        void run(() => updateTransaction(existing.id, payload), () => router.back());
      } else {
        void run(() => addTransaction(payload), () => router.push("/transactions"));
      }
      return;
    }

    const numeric = parseFloat(amount);
    if (!numeric || numeric <= 0 || !resolvedAccountId) return;

    if (existing) {
      void run(
        () => updateTransaction(existing.id, { type, amount: numeric, accountId: resolvedAccountId, categoryIds: categoryIds.length ? categoryIds : undefined, date, note }),
        () => router.back()
      );
      return;
    }

    if (recurring) {
      void run(() => {
        addRecurringRule({
          kind: "transaction",
          frequency,
          startDate: date,
          nextDueDate: date,
          amount: numeric,
          accountId: resolvedAccountId,
          categoryIds: categoryIds.length ? categoryIds : undefined,
          note,
          active: true,
          txType: type,
        });
        generatePending();
      }, () => router.push("/transactions"));
    } else {
      void run(
        () => addTransaction({ type, amount: numeric, accountId: resolvedAccountId, categoryIds: categoryIds.length ? categoryIds : undefined, date, note }),
        () => router.push("/transactions")
      );
    }
  }

  const saveLabel = existing ? "Save changes" : type === "transfer" ? "Save transfer" : type === "expense" ? "Save expense" : "Save income";
  const saveColorClass = type === "expense" ? "!bg-expense" : type === "income" ? "!bg-income" : "!bg-accent";

  return (
    <div className="flex flex-col px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">{existing ? "Edit transaction" : "Add transaction"}</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>

      <div className="mt-3.5">
        <Segmented
          value={type}
          onChange={(v) => {
            setType(v);
            setCategoryIds([]);
            if (v !== "transfer") setRecurring(false);
          }}
          options={
            accounts.length > 1
              ? [
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                  { value: "transfer", label: "Transfer" },
                ]
              : [
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]
          }
          activeClassName={`bg-card shadow-sm ${typeAccent[type]}`}
        />
      </div>

      <div className="mt-5 flex items-center gap-2 border-b border-line pb-3.5">
        <span className="shrink-0 whitespace-nowrap rounded-lg bg-paper-deep px-2.5 py-1.5 font-mono text-sm text-ink-soft">
          {account?.currency ?? ""} {currencySymbol(account?.currency ?? "")}
        </span>
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
          className="w-full bg-transparent font-mono text-4xl font-semibold tabular-nums outline-none placeholder:text-ink-faint/50"
        />
      </div>

      <div className="flex items-center justify-between border-b border-line py-3.5 text-[13.5px]">
        <span className="text-ink-faint">{type === "transfer" ? "From" : "Account"}</span>
        <SelectInput value={resolvedAccountId} onChange={(e) => setAccountId(e.target.value)} className="w-auto border-none bg-transparent p-0 text-right font-semibold">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} {a.isPrimary ? "· Primary" : ""}
            </option>
          ))}
        </SelectInput>
      </div>

      {type === "transfer" && (
        <>
          <div className="flex items-center justify-between border-b border-line py-3.5 text-[13.5px]">
            <span className="text-ink-faint">To</span>
            <SelectInput
              value={resolvedToAccountId}
              onChange={(e) => {
                setToAccountId(e.target.value);
              }}
              className="w-auto border-none bg-transparent p-0 text-right font-semibold"
            >
              {toOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.isPrimary ? "· Primary" : ""}
                </option>
              ))}
            </SelectInput>
          </div>

          <div className="flex items-center justify-between border-b border-line py-3.5 text-[13.5px]">
            <span className="text-ink-faint">
              Exchange rate <span className="text-ink-faint/70">(1 {account?.currency} =)</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                inputMode="decimal"
                value={rate}
                onChange={(e) => {
                  setManualRate(sanitizeDecimalInput(e.target.value));
                  setRateTouched(true);
                }}
                className="w-20 bg-transparent text-right font-mono font-semibold tabular-nums outline-none"
              />
              <span className="font-mono text-ink-faint">{toAccount?.currency}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-line py-3.5 text-[13.5px]">
            <span className="text-ink-faint">They receive</span>
            <span className="tabular font-semibold text-accent">
              {currencySymbol(toAccount?.currency ?? "")}
              {receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="pt-2 text-[11.5px] leading-relaxed text-ink-faint">
            Defaults to {account?.name}&apos;s and {toAccount?.name}&apos;s saved exchange rates — change it here and it only applies to this transfer.
          </p>
        </>
      )}

      <div className="flex items-center justify-between border-b border-line py-3.5 text-[13.5px]">
        <span className="text-ink-faint">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent text-right font-semibold text-ink outline-none"
        />
      </div>

      {type !== "transfer" && (
        <>
          <div className="mt-4 mb-2 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Category</span>
            <span className="text-[10.5px] text-ink-faint">Pick as many as apply</span>
          </div>
          <CategoryPicker categories={categories} type={type} selectedIds={categoryIds} onToggle={toggleCategory} />
        </>
      )}

      <div className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Note</div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
        className="w-full resize-none rounded-xl border border-line bg-card px-3.5 py-3 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />

      {!existing && type !== "transfer" && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[13.5px] font-semibold">Make this recurring</span>
            <Switch checked={recurring} onChange={setRecurring} />
          </div>
          {recurring && (
            <div className="mt-3">
              <SelectInput value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                {frequencies.map((f) => (
                  <option key={f} value={f}>
                    {frequencyLabel[f]}
                  </option>
                ))}
              </SelectInput>
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
                A pending entry will be created each {frequencyLabel[frequency].toLowerCase()} cycle starting {date}. You&apos;ll confirm it manually once it&apos;s actually paid or received.
              </p>
            </div>
          )}
        </>
      )}

      {error && <p className="mt-4 text-center text-[12.5px] text-expense">{error}</p>}

      <div className="mt-6">
        <Button onClick={submit} disabled={saving} className={saveColorClass}>
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Saving…
            </span>
          ) : (
            saveLabel
          )}
        </Button>
        {existing && (
          <button
            onClick={() => {
              if (confirm("Delete this transaction? This can't be undone.")) {
                void run(() => deleteTransaction(existing.id), () => router.push("/transactions"));
              }
            }}
            disabled={saving}
            className="mt-3 w-full text-center text-[13px] font-semibold text-expense disabled:opacity-40"
          >
            Delete transaction
          </button>
        )}
      </div>
    </div>
  );
}
