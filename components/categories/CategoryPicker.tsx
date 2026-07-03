import type { Category, TxType } from "@/lib/types";

export function CategoryPicker({
  categories,
  type,
  selectedIds,
  onToggle,
}: {
  categories: Category[];
  type: TxType;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const list = categories.filter((c) => c.type === type);
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {list.map((c) => {
        const selected = selectedIds.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center text-[10.5px] ${
              selected
                ? type === "expense"
                  ? "border-expense bg-expense-soft text-expense"
                  : "border-income bg-income-soft text-income"
                : "border-line bg-card text-ink-soft"
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[15px] ${selected ? "bg-white" : "bg-paper-deep"}`}>
              {c.icon}
            </span>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
