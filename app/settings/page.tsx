"use client";

import { useRef } from "react";
import { useCashierStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { todayIso } from "@/lib/format";

export default function SettingsPage() {
  const categories = useCashierStore((s) => s.categories);
  const accounts = useCashierStore((s) => s.accounts);
  const transactions = useCashierStore((s) => s.transactions);
  const debts = useCashierStore((s) => s.debts);
  const recurringRules = useCashierStore((s) => s.recurringRules);
  const importData = useCashierStore((s) => s.importData);
  const resetAllData = useCashierStore((s) => s.resetAllData);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const payload = { accounts, categories, transactions, debts, recurringRules, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashier-backup-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data: unknown;
      try {
        data = JSON.parse(String(reader.result));
      } catch {
        alert("That file isn't valid JSON — it doesn't look like a Cashier backup.");
        return;
      }
      // Only accept an object whose known keys (when present) are arrays, so a
      // malformed file can't corrupt the store (and get synced to the cloud).
      const keys = ["accounts", "categories", "transactions", "debts", "recurringRules"] as const;
      const obj = data as Record<string, unknown> | null;
      const present = obj && typeof obj === "object" ? keys.filter((k) => k in obj) : [];
      if (present.length === 0 || !present.every((k) => Array.isArray(obj![k]))) {
        alert("That file doesn't look like a valid Cashier backup.");
        return;
      }
      if (confirm("Importing replaces all your current data with this backup. This can't be undone. Continue?")) {
        importData(obj as Parameters<typeof importData>[0]);
        alert("Backup imported.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function onReset() {
    if (confirm("This permanently clears all your data — transactions, debts, accounts and categories — on every device (it's synced to your account). This can't be undone. Continue?")) {
      resetAllData();
    }
  }

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="font-serif text-xl font-semibold">Data & Backups</h1>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-faint">
        Your data is synced to your account and shared across your devices. Export a backup any time to keep your own offline copy (.json).
      </p>
      <div className="mt-4 flex flex-col gap-2.5">
        <Button variant="outline" onClick={exportData}>
          Export backup (.json)
        </Button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={onImportFile} className="hidden" />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Import backup
        </Button>
        <button onClick={onReset} className="mt-2 w-full text-center text-[13px] font-semibold text-expense">
          Clear all data
        </button>
      </div>
    </div>
  );
}
