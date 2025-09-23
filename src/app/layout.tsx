import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Fashion Killa Survey",
  description: "Customer survey for fashion products",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Script
          type="module"
          strategy="afterInteractive"
          src="https://cdn.jsdelivr.net/gh/onlook-dev/onlook@main/apps/web/client/public/onlook-preload-script.js"
        />
      </body>
    </html>
  );
}
