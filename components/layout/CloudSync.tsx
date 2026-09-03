"use client";

import { useEffect, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/authStore";
import { useSyncStore } from "@/lib/syncStore";
import { useCashierStore } from "@/lib/store";
import { hasAnyData, pullFromCloud, pushToCloud, saveNow, scheduleSync } from "@/lib/sync";

/**
 * Owns the whole cloud-as-source-of-truth lifecycle:
 *  - tracks the Supabase auth session,
 *  - on sign-in pulls the user's data (seeding a brand-new account),
 *  - pushes every local change back up (debounced),
 *  - re-pulls whenever the tab/app regains focus so a second device always
 *    continues from the same history,
 *  - clears the in-memory store on sign-out.
 */
export function CloudSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthResolved = useAuthStore((s) => s.setAuthResolved);
  const setDataLoaded = useAuthStore((s) => s.setDataLoaded);
  const setLoadError = useAuthStore((s) => s.setLoadError);
  const userId = useAuthStore((s) => s.user?.id);
  const reloadNonce = useAuthStore((s) => s.reloadNonce);

  const loadedFor = useRef<string | null>(null);
  // While we're applying a snapshot pulled from the cloud, suppress the
  // push-on-change subscription so the pull doesn't immediately echo back up.
  const applyingRemote = useRef(false);

  // 1. Track the auth session.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Misconfigured deploy: resolve as signed-out so the gate can show /login
      // rather than hanging on the loading screen forever.
      setAuthResolved(true);
      return;
    }
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null))
      .catch((e) => console.error("getSession failed", e))
      .finally(() => setAuthResolved(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [setUser, setAuthResolved]);

  // 2. Load (or clear) the store when the signed-in user changes.
  useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      useCashierStore.getState().resetToEmpty();
      setDataLoaded(false);
      setLoadError(false);
      return;
    }
    if (loadedFor.current === userId) return;

    let cancelled = false;
    (async () => {
      const result = await pullFromCloud(userId);
      if (cancelled) return;

      // Crucial: a failed pull is NOT an empty account. Never seed/overwrite here —
      // that would replace real cloud data with a fresh seed. Show a retry instead.
      if (!result.ok) {
        setLoadError(true);
        return;
      }
      const remote = result.data;

      applyingRemote.current = true;
      if (hasAnyData(remote) && remote) {
        useCashierStore.getState().importData(remote);
      } else {
        // Genuinely new account (no row yet) — give them the default wallet + categories.
        useCashierStore.getState().seedIfEmpty();
      }
      useCashierStore.getState().generatePending();
      applyingRemote.current = false;

      // Persist the seed and/or any freshly generated pending transactions.
      await pushToCloud(userId);
      if (cancelled) return;

      loadedFor.current = userId;
      setLoadError(false);
      setDataLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadNonce, setDataLoaded, setLoadError]);

  // 3. Once loaded: push local changes up, and re-pull on focus.
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = useCashierStore.subscribe(() => {
      if (loadedFor.current === userId && !applyingRemote.current) {
        useSyncStore.getState().update({ dirty: true });
        scheduleSync(userId);
      }
    });

    // Warn before a refresh/close while a local change hasn't reached the cloud yet,
    // so an add made on a slow connection isn't silently lost.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useSyncStore.getState().dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    const onFocus = async () => {
      if (document.visibilityState !== "visible") return;
      if (loadedFor.current !== userId) return;
      // If there are unsaved local changes, save them first and DON'T pull if that
      // fails — otherwise the cloud copy would clobber changes that never got saved.
      if (useSyncStore.getState().dirty) {
        const saved = await saveNow(userId);
        if (!saved) return;
      }
      const result = await pullFromCloud(userId);
      if (!result.ok || !result.data || loadedFor.current !== userId) return;
      applyingRemote.current = true;
      useCashierStore.getState().importData(result.data);
      applyingRemote.current = false;
      // Runs outside the suppress guard so newly-due recurring items sync up.
      useCashierStore.getState().generatePending();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [userId]);

  return null;
}
