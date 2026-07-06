"use client";

import { useEffect, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/authStore";
import { useCashierStore } from "@/lib/store";
import { hasAnyData, pullFromCloud, pushToCloud, scheduleSync } from "@/lib/sync";

async function reconcile(userId: string) {
  const remote = await pullFromCloud(userId);
  const local = useCashierStore.getState();
  const localHasData =
    local.accounts.length > 0 || local.transactions.length > 0 || local.debts.length > 0 || local.recurringRules.length > 0;
  const remoteHasData = hasAnyData(remote);

  if (remoteHasData && remote && localHasData) {
    const useCloud = confirm(
      "You have data both on this device and synced from the cloud. Press OK to use your cloud data (replacing what's on this device), or Cancel to keep this device's data (replacing the cloud copy)."
    );
    if (useCloud) {
      useCashierStore.getState().importData(remote);
      useCashierStore.getState().generatePending();
    } else {
      await pushToCloud(userId);
    }
    return;
  }

  if (remoteHasData && remote) {
    useCashierStore.getState().importData(remote);
    useCashierStore.getState().generatePending();
    return;
  }

  await pushToCloud(userId);
}

export function CloudSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const userId = useAuthStore((s) => s.user?.id);
  const reconciledFor = useRef<string | null>(null);

  // Track the Supabase auth session.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [setUser]);

  // Reconcile once per sign-in, deferred until the local store has finished hydrating
  // from localStorage (hydration is async, so "local has no data" can't be trusted yet).
  useEffect(() => {
    if (!userId) {
      reconciledFor.current = null;
      return;
    }
    if (reconciledFor.current === userId) return;

    const tryReconcile = () => {
      if (reconciledFor.current === userId) return;
      if (!useCashierStore.getState().hasHydrated) return;
      reconciledFor.current = userId;
      void reconcile(userId);
    };

    tryReconcile();
    return useCashierStore.subscribe(tryReconcile);
  }, [userId]);

  // While signed in and past the initial reconcile, debounce-push every local change.
  useEffect(() => {
    if (!userId) return;
    return useCashierStore.subscribe(() => {
      if (reconciledFor.current === userId) scheduleSync(userId);
    });
  }, [userId]);

  return null;
}
