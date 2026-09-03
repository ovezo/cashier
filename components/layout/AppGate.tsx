"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { Button } from "@/components/ui/Button";

function Splash() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-paper">
      <div className="font-serif text-2xl font-bold tracking-tight">Cashier</div>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Loading" />
    </div>
  );
}

function LoadError() {
  const requestReload = useAuthStore((s) => s.requestReload);
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="font-serif text-2xl font-bold tracking-tight">Cashier</div>
      <p className="text-[13.5px] leading-relaxed text-ink-faint">
        Couldn&apos;t load your data — you may be offline or on a weak connection. Your data is safe; nothing was changed.
      </p>
      <div className="w-full max-w-[240px]">
        <Button onClick={requestReload}>Try again</Button>
      </div>
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
  const loadError = useAuthStore((s) => s.loadError);

  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!authResolved) return;
    if (!user && !isLogin) router.replace("/login");
    if (user && isLogin) router.replace("/");
  }, [authResolved, user, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!authResolved || !user) return <Splash />;
  if (loadError) return <LoadError />;
  if (!dataLoaded) return <Splash />;
  return <>{children}</>;
}
