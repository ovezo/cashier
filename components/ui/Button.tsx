import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white",
  ghost: "bg-paper-deep text-ink",
  outline: "bg-card text-ink border border-line",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-opacity active:opacity-80 disabled:opacity-40 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
