import { create } from "zustand";

/** Tracks whether local changes have reached the cloud, so the UI can show a
 * saving spinner, warn before refresh, and surface save failures. */
interface SyncState {
  saving: boolean; // a push is currently in flight
  dirty: boolean; // there are local changes not yet confirmed saved
  error: boolean; // the last push attempt failed
  update: (patch: Partial<Pick<SyncState, "saving" | "dirty" | "error">>) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  saving: false,
  dirty: false,
  error: false,
  update: (patch) => set(patch),
}));
