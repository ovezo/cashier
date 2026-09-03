import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  /** True once we've heard back from Supabase at least once (session or not). */
  authResolved: boolean;
  /** True once the signed-in user's data has been pulled from the cloud. */
  dataLoaded: boolean;
  /** True when the initial cloud pull failed — we must NOT seed/overwrite; show a retry. */
  loadError: boolean;
  /** Bumped to ask CloudSync to retry the initial load. */
  reloadNonce: number;
  setUser: (user: User | null) => void;
  setAuthResolved: (v: boolean) => void;
  setDataLoaded: (v: boolean) => void;
  setLoadError: (v: boolean) => void;
  requestReload: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authResolved: false,
  dataLoaded: false,
  loadError: false,
  reloadNonce: 0,
  setUser: (user) => set({ user }),
  setAuthResolved: (authResolved) => set({ authResolved }),
  setDataLoaded: (dataLoaded) => set({ dataLoaded }),
  setLoadError: (loadError) => set({ loadError }),
  requestReload: () => set((s) => ({ loadError: false, reloadNonce: s.reloadNonce + 1 })),
}));
