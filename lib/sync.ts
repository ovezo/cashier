import { createClient } from "./supabase/client";
import { useCashierStore } from "./store";
import { useSyncStore } from "./syncStore";
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

/** Pushes the whole store to the cloud, retrying a couple of times on transient
 * failures (slow/flaky network). Returns whether it ultimately succeeded, and keeps
 * the global sync indicator in step. The payload is re-read on each attempt so a
 * retry always sends the latest state. */
export async function pushToCloud(userId: string): Promise<boolean> {
  const supabase = createClient();
  useSyncStore.getState().update({ saving: true });
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
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
    if (!error) {
      useSyncStore.getState().update({ saving: false, dirty: false, error: false });
      return true;
    }
    lastError = error;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  console.error("pushToCloud failed", lastError);
  useSyncStore.getState().update({ saving: false, error: true });
  return false;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced push so rapid local edits don't hammer the DB with a write per keystroke. */
export function scheduleSync(userId: string): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushToCloud(userId);
  }, 1000);
}

/** Cancel any pending debounced push and write immediately, awaiting the result.
 * Used by explicit save actions (so we only navigate once saved) and before a
 * pull-on-focus (so a just-made local edit isn't overwritten by the cloud copy). */
export async function saveNow(userId: string): Promise<boolean> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  return pushToCloud(userId);
}

/** Flush only if a debounced push is still pending (nothing to do otherwise). */
export async function flushSync(userId: string): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    await pushToCloud(userId);
  }
}
