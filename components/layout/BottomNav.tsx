"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, PieChart, MoreHorizontal, Plus } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: Receipt },
];
const itemsRight = [
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  const renderItem = (item: (typeof items)[number]) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
          active ? "font-semibold text-accent" : "text-ink-faint"
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="sticky bottom-0 z-10 flex items-center justify-around border-t border-line bg-card px-1.5 pb-3.5 pt-2">
      {items.map(renderItem)}
      <Link
        href="/add"
        aria-label="Add transaction"
        className="-mt-6 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30"
      >
        <Plus size={22} />
      </Link>
      {itemsRight.map(renderItem)}
    </nav>
  );
}
