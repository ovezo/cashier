import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  /** True once we've heard back from Supabase at least once (session or not). */
  authResolved: boolean;
  /** True once the signed-in user's data has been pulled from the cloud. */
  dataLoaded: boolean;
  setUser: (user: User | null) => void;
  setAuthResolved: (v: boolean) => void;
  setDataLoaded: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authResolved: false,
  dataLoaded: false,
  setUser: (user) => set({ user }),
  setAuthResolved: (authResolved) => set({ authResolved }),
  setDataLoaded: (dataLoaded) => set({ dataLoaded }),
}));
