"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Bookmark, User, Sparkles } from "lucide-react";
import { GradientDivider } from "@/components/GradientDivider";

/**
 * Bottom navigation bar for mobile layout.
 * Uses Next.js router for navigation and derives active tab from the current pathname.
 */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  // Derive active tab from the current pathname
  const getActiveTab = (): string => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/products") || pathname.startsWith("/category")) return "home";
    if (pathname.startsWith("/collections")) return "collections";
    if (pathname.startsWith("/chat")) return "chat";
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/profile") || pathname.startsWith("/preferences")) return "profile";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white max-w-md mx-auto shadow-[0px_-2px_4px_0px_rgba(14,31,53,0.12)] md:hidden">
      <GradientDivider />
      <div className="flex items-center justify-around px-4 py-4">
        <button
          onClick={() => router.push("/")}
          className="flex flex-col items-center gap-1 p-2 focus:outline-none"
        >
          <Home
            className={`w-5 h-5 ${
              activeTab === "home" ? "text-black" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => router.push("/search")}
          className="flex flex-col items-center gap-1 p-2 focus:outline-none"
        >
          <Search
            className={`w-5 h-5 ${
              activeTab === "search" ? "text-black" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => router.push("/chat")}
          className="flex flex-col items-center gap-1 p-2 focus:outline-none"
        >
          <Sparkles
            className={`w-5 h-5 ${
              activeTab === "chat" ? "text-black" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => router.push("/collections")}
          className="flex flex-col items-center gap-1 p-2 focus:outline-none"
        >
          <Bookmark
            className={`w-5 h-5 ${
              activeTab === "collections" ? "text-black" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => router.push("/profile")}
          className="flex flex-col items-center gap-1 p-2 focus:outline-none"
        >
          <User
            className={`w-5 h-5 ${
              activeTab === "profile" ? "text-black" : "text-gray-400"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
