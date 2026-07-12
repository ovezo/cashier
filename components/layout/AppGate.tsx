"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

function Splash() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-paper">
      <div className="font-serif text-2xl font-bold tracking-tight">Cashier</div>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Loading" />
    </div>
  );
}

/**
 * Auth gate for the whole app. `/login` is the only public route; everything
 * else requires a signed-in user whose cloud data has finished loading.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authResolved = useAuthStore((s) => s.authResolved);
  const user = useAuthStore((s) => s.user);
  const dataLoaded = useAuthStore((s) => s.dataLoaded);

  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!authResolved) return;
    if (!user && !isLogin) router.replace("/login");
    if (user && isLogin) router.replace("/");
  }, [authResolved, user, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!authResolved || !user || !dataLoaded) return <Splash />;
  return <>{children}</>;
}
