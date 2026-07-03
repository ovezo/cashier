"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import type { TxType } from "@/lib/types";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";

const CAT_TOKENS = ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5", "cat-6"];

export default function CategoriesPage() {
  const categories = useCashierStore((s) => s.categories);
  const addCategory = useCashierStore((s) => s.addCategory);
  const deleteCategory = useCashierStore((s) => s.deleteCategory);

  const [type, setType] = useState<TxType>("expense");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");

  function addCat() {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), type, icon, color: CAT_TOKENS[categories.length % CAT_TOKENS.length] });
    setName("");
    setIcon("🏷️");
  }

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="font-serif text-xl font-semibold">Categories</h1>
      <p className="mt-1 text-[12.5px] text-ink-faint">
        A transaction can carry more than one category — pick as many as apply when you add it.
      </p>

      <div className="mt-4 rounded-2xl border border-line bg-card">
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
    </div>
  );
}
