"use client";

import { useEffect } from "react";
import { useCashierStore } from "@/lib/store";

export function StoreHydrator() {
  const hasHydrated = useCashierStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      useCashierStore.getState().seedIfEmpty();
      useCashierStore.getState().generatePending();
    }
  }, [hasHydrated]);

  return null;
}
