import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FitCurry — Discover Indie Indian Fashion",
  description: "AI-powered outfit recommendations from 140+ indie Indian brands. Find your style, build your wardrobe.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning silences the false-positive caused by
          browser extensions (Grammarly, LastPass) injecting data-* attrs
          on <body> after the server-rendered HTML loads. */}
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
