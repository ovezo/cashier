"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import type { TxType } from "@/lib/types";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";

const CAT_TOKENS = ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5", "cat-6"];

export default function SettingsPage() {
  const categories = useCashierStore((s) => s.categories);
  const addCategory = useCashierStore((s) => s.addCategory);
  const deleteCategory = useCashierStore((s) => s.deleteCategory);
  const accounts = useCashierStore((s) => s.accounts);
  const transactions = useCashierStore((s) => s.transactions);
  const debts = useCashierStore((s) => s.debts);
  const recurringRules = useCashierStore((s) => s.recurringRules);
  const importData = useCashierStore((s) => s.importData);
  const resetAllData = useCashierStore((s) => s.resetAllData);

  const [type, setType] = useState<TxType>("expense");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addCat() {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), type, icon, color: CAT_TOKENS[categories.length % CAT_TOKENS.length] });
    setName("");
    setIcon("🏷️");
  }

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

      <div className="mt-4 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Categories</div>
      <div className="rounded-2xl border border-line bg-card">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5 border-b border-line p-3 last:border-b-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper-deep text-[15px]">{c.icon}</span>
            <span className="flex-1 text-[13px] font-semibold">{c.name}</span>
            <span className="font-mono text-[10.5px] uppercase text-ink-faint">{c.type}</span>
            <button aria-label={`Delete ${c.name}`} onClick={() => deleteCategory(c.id)} className="text-ink-faint">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-line bg-card p-3.5">
        <Segmented value={type} onChange={setType} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} />
        <div className="mt-2.5 flex gap-2">
          <TextInput value={icon} onChange={(e) => setIcon(e.target.value)} className="w-14 text-center" maxLength={2} />
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
        </div>
        <div className="mt-2.5">
          <Button variant="outline" onClick={addCat}>
            Add category
          </Button>
        </div>
      </div>

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
