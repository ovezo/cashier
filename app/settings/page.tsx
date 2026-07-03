"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, Tag } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

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
    a.download = `cashier-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        importData(data);
        alert("Backup imported.");
      } catch {
        alert("That file doesn't look like a valid Cashier backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function onReset() {
    if (confirm("This clears all local data (transactions, debts, accounts, categories). This can't be undone. Continue?")) {
      resetAllData();
    }
  }

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="font-serif text-xl font-semibold">Settings</h1>

      <Link href="/settings/categories" className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-ink-soft">
          <Tag size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">Categories</div>
          <div className="truncate text-[11.5px] text-ink-faint">{categories.length} categories</div>
        </div>
        <ChevronRight size={16} className="shrink-0 text-ink-faint" />
      </Link>

      <div className="mt-5 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Backup & data</div>
      <p className="text-[12px] leading-relaxed text-ink-faint">
        Everything lives only in this browser&apos;s local storage — nothing is uploaded anywhere. Export a backup regularly so you don&apos;t lose data if you clear your browser.
      </p>
      <div className="mt-3 flex flex-col gap-2.5">
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
