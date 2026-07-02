"use client";

import { use } from "react";
import { useCashierStore } from "@/lib/store";
import { AccountForm } from "@/components/accounts/AccountForm";

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const account = useCashierStore((s) => s.accounts.find((a) => a.id === id));

  if (!account) return <p className="px-4 py-8 text-sm text-ink-faint">Account not found.</p>;
  return <AccountForm existing={account} />;
}
