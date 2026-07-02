import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { StoreHydrator } from "@/components/layout/StoreHydrator";

export const metadata: Metadata = {
  title: "Cashier",
  description: "Track income, expenses, debts and recurring bills — fully offline, in your primary currency.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2b3a67",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full font-sans antialiased">
      <body className="min-h-full bg-paper-deep">
        <StoreHydrator />
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.08)]">
          <div className="flex-1">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
