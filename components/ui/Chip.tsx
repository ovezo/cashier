import type { HTMLAttributes } from "react";

type Tone = "accent" | "income" | "expense" | "pending" | "muted";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  pending: "bg-pending-soft text-pending",
  muted: "bg-paper-deep text-ink-faint",
};

export function Chip({
  tone = "muted",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
