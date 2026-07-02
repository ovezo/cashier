import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{children}</div>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-line bg-card px-3.5 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-line bg-card px-3.5 py-3 text-sm text-ink focus:border-accent focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3.5 text-[13.5px] last:border-b-0">
      <div className="text-ink-faint">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
