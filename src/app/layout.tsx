import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FitCurry — The Daily.",
  description: "A daily issue of outfits from 140+ indie Indian labels — Banjaaran, Kalki, Gully Labs, twoextralives and more. A style magazine that builds itself for you.",
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
