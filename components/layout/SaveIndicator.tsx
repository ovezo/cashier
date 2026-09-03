"use client";

import { useAuthStore } from "@/lib/authStore";
import { useSyncStore } from "@/lib/syncStore";
import { saveNow } from "@/lib/sync";
import { Spinner } from "@/components/ui/Spinner";

/** App-wide save status: a "Saving…" pill while a change is being written to the
 * cloud, or a "Couldn't save" pill with a Retry button if a write failed. */
export function SaveIndicator() {
  const userId = useAuthStore((s) => s.user?.id);
  const saving = useSyncStore((s) => s.saving);
  const dirty = useSyncStore((s) => s.dirty);
  const error = useSyncStore((s) => s.error);

  if (error) {
    return (
      <div className="fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
        <div className="flex items-center gap-2.5 rounded-full border border-expense/30 bg-card px-3.5 py-1.5 text-[12px] shadow-md">
          <span className="font-semibold text-expense">Couldn&apos;t save changes</span>
          <button onClick={() => userId && saveNow(userId)} className="font-semibold text-accent">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // `dirty` gates out the brief push that runs on initial load (no user change yet).
  if (saving && dirty) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
        <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-[12px] font-semibold text-ink-soft shadow-md">
          <Spinner className="h-3.5 w-3.5 text-ink-faint" /> Saving…
        </div>
      </div>
    );
  }

  return null;
}
