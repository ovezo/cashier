interface Option<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  activeClassName = "bg-card text-ink shadow-sm",
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  activeClassName?: string;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-paper-deep p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            value === opt.value ? activeClassName : "text-ink-soft"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
