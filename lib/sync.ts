import { createClient } from "./supabase/client";
import { useCashierStore } from "./store";
import type { Account, Category, Debt, RecurringRule, Transaction } from "./types";

export interface SyncPayload {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  recurringRules: RecurringRule[];
}

export function hasAnyData(data: SyncPayload | null | undefined): boolean {
  if (!data) return false;
  return (
    (data.accounts?.length ?? 0) > 0 ||
    (data.transactions?.length ?? 0) > 0 ||
    (data.debts?.length ?? 0) > 0 ||
    (data.recurringRules?.length ?? 0) > 0
  );
}

export async function pullFromCloud(userId: string): Promise<SyncPayload | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("user_data").select("data").eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("pullFromCloud failed", error);
    return null;
  }
  return (data?.data as SyncPayload | undefined) ?? null;
}

export async function pushToCloud(userId: string): Promise<void> {
  const supabase = createClient();
  const s = useCashierStore.getState();
  const payload: SyncPayload = {
    accounts: s.accounts,
    categories: s.categories,
    transactions: s.transactions,
    debts: s.debts,
    recurringRules: s.recurringRules,
  };
  const { error } = await supabase
    .from("user_data")
    .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() });
  if (error) console.error("pushToCloud failed", error);
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced push so rapid local edits don't hammer the DB with a write per keystroke. */
export function scheduleSync(userId: string): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void pushToCloud(userId);
  }, 1500);
}
