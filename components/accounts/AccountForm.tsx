"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import type { Account } from "@/lib/types";
import { COMMON_CURRENCIES } from "@/lib/currencies";
import { sanitizeDecimalInput } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Label, SelectInput, TextInput } from "@/components/ui/Field";

export function AccountForm({ existing }: { existing?: Account }) {
  const router = useRouter();
  const addAccount = useCashierStore((s) => s.addAccount);
  const updateAccount = useCashierStore((s) => s.updateAccount);
  const deleteAccount = useCashierStore((s) => s.deleteAccount);
  const setPrimaryAccount = useCashierStore((s) => s.setPrimaryAccount);
  const accounts = useCashierStore((s) => s.accounts);

  const [name, setName] = useState(existing?.name ?? "");
  const [currency, setCurrency] = useState(existing?.currency ?? "USD");
  const [rate, setRate] = useState(existing ? String(existing.exchangeRateToPrimary) : "1");
  const [openingBalance, setOpeningBalance] = useState(existing ? String(existing.openingBalance) : "");

  const primary = accounts.find((a) => a.isPrimary);
  const isPrimary = existing?.isPrimary ?? false;

  function submit() {
    if (!name.trim()) return;
    const rateNum = parseFloat(rate) || 1;
    const openingBalanceNum = parseFloat(openingBalance) || 0;
    if (existing) {
      updateAccount(existing.id, { name: name.trim(), currency, exchangeRateToPrimary: isPrimary ? 1 : rateNum, openingBalance: openingBalanceNum });
    } else {
      addAccount({ name: name.trim(), currency, exchangeRateToPrimary: rateNum, openingBalance: openingBalanceNum });
    }
    router.push("/accounts");
  }

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">{existing ? "Edit account" : "Add account"}</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>

      <div className="mt-5">
        <Label>Account name</Label>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. USD Wallet" />
      </div>

      <div className="mt-4">
        <Label>Currency</Label>
        <SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {COMMON_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="mt-4">
        <Label>Starting balance</Label>
        <TextInput inputMode="decimal" value={openingBalance} onChange={(e) => setOpeningBalance(sanitizeDecimalInput(e.target.value))} placeholder="0.00" />
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
          What this wallet already held before you started tracking it here. Totals add this on top of your logged transactions.
        </p>
      </div>

      {!isPrimary && (
        <div className="mt-4">
          <Label>Exchange rate → {primary?.currency ?? "primary"}</Label>
          <TextInput inputMode="decimal" value={rate} onChange={(e) => setRate(sanitizeDecimalInput(e.target.value))} placeholder="0.79" />
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
            1 {currency} = {rate || "0"} {primary?.currency ?? ""}. Set this manually and update it whenever you like.
          </p>
        </div>
      )}

      {isPrimary && (
        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
          This is your primary account — all overviews and totals are shown in {currency}.
        </p>
      )}

      <div className="mt-6">
        <Button onClick={submit}>{existing ? "Save changes" : "Add account"}</Button>
      </div>

      {existing && (
        <div className="mt-3 flex flex-col gap-2">
          {!isPrimary && (
            <button
              onClick={() => {
                setPrimaryAccount(existing.id);
                router.push("/accounts");
              }}
              className="w-full rounded-xl bg-paper-deep px-4 py-3 text-[13px] font-semibold text-ink"
            >
              Set as primary account
            </button>
          )}
          <button
            onClick={() => {
              deleteAccount(existing.id);
              router.push("/accounts");
            }}
            className="w-full text-center text-[13px] font-semibold text-expense"
          >
            Delete account
          </button>
        </div>
      )}
    </div>
  );
}
