"use client";

import Link from "next/link";
import { ChevronRight, Landmark, Repeat, Wallet, Tag, DatabaseBackup, CloudUpload, LogOut } from "lucide-react";
import { useCashierStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { createClient } from "@/lib/supabase/client";

export default function MorePage() {
  const debts = useCashierStore((s) => s.debts);
  const categories = useCashierStore((s) => s.categories);
  const pendingCount = useCashierStore((s) => s.transactions.filter((t) => t.status === "pending").length);
  const user = useAuthStore((s) => s.user);

  const openDebts = debts.filter((d) => d.status !== "paid").length;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const items = [
    { href: "/debts", label: "Debts", desc: "Money owed to you and by you", icon: Landmark, badge: openDebts > 0 ? String(openDebts) : undefined },
    { href: "/recurring", label: "Recurring", desc: "Scheduled income, bills & instalments", icon: Repeat, badge: pendingCount > 0 ? String(pendingCount) : undefined },
    { href: "/accounts", label: "Accounts", desc: "Currencies, exchange rates, primary account", icon: Wallet },
    { href: "/categories", label: "Categories", desc: `${categories.length} categories`, icon: Tag },
    { href: "/settings", label: "Data & Backups", desc: "Export, import & clear your data", icon: DatabaseBackup },
  ];

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="font-serif text-xl font-semibold">More</h1>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <CloudUpload size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold">Synced to your account</div>
          <div className="truncate text-[11.5px] text-ink-faint">{user?.email ?? "Signed in"}</div>
        </div>
        <button onClick={signOut} aria-label="Sign out" className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-expense">
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-ink-soft">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{item.label}</div>
                <div className="truncate text-[11.5px] text-ink-faint">{item.desc}</div>
              </div>
              {item.badge && (
                <span className="rounded-full bg-pending-soft px-2 py-0.5 font-mono text-[11px] text-pending">{item.badge}</span>
              )}
              <ChevronRight size={16} className="shrink-0 text-ink-faint" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
