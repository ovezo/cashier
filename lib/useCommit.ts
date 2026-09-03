"use client";

import { useCallback, useState } from "react";
import { useAuthStore } from "./authStore";
import { saveNow } from "./sync";

/**
 * Applies a store mutation and waits for it to actually reach the cloud, so a
 * caller can navigate or close only once the change is saved — no more phantom
 * adds that vanish on refresh. Returns false if the save failed (offline/slow);
 * the caller should surface an error and stay put so the data isn't lost.
 */
export function useCommit() {
  const userId = useAuthStore((s) => s.user?.id);
  const [saving, setSaving] = useState(false);

  const commit = useCallback(
    async (mutate: () => void): Promise<boolean> => {
      mutate();
      if (!userId) return true;
      setSaving(true);
      const ok = await saveNow(userId);
      setSaving(false);
      return ok;
    },
    [userId]
  );

  return { commit, saving };
}
