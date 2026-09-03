"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-auto flex max-h-[82vh] w-full max-w-[480px] flex-col rounded-t-2xl bg-paper shadow-[0_-8px_40px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line" />
        <div className="flex items-start justify-between gap-2 px-4 pb-3 pt-2.5">
          <div className="min-w-0">
            <div className="font-serif text-[16px] font-semibold">{title}</div>
            {subtitle && <div className="mt-0.5 text-[12.5px] text-ink-faint">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1 shrink-0 text-ink-faint">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-8">{children}</div>
      </div>
    </div>
  );
}
