import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "ghost" | "outline";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white",
  ghost: "bg-paper-deep text-ink",
  outline: "bg-card text-ink border border-line",
};

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link
      className={`block w-full rounded-xl px-4 py-3.5 text-center text-sm font-semibold transition-opacity active:opacity-80 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
