"use client";

import { useRouter, usePathname } from "next/navigation";
import { User } from "lucide-react";

/**
 * Desktop top navigation bar. Hidden on mobile (md:flex).
 * Replaces BottomNav on larger screens with an editorial-style top bar.
 */
export function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname.startsWith("/products") || pathname.startsWith("/category");
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `text-[13px] uppercase tracking-[0.15em] transition-colors cursor-pointer ${
      isActive(path)
        ? "text-black"
        : "text-gray-400 hover:text-black"
    }`;

  return (
    <nav className="hidden md:flex items-center justify-between px-8 lg:px-12 py-5 border-b border-gray-100">
      {/* Left: Logo */}
      <button
        onClick={() => router.push("/")}
        className="focus:outline-none"
        style={{
          fontFamily: "'Cirka', serif",
          fontSize: "1.5rem",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        Fitcurry
      </button>

      {/* Center: Nav links */}
      <div className="flex items-center gap-8 lg:gap-12">
        <button onClick={() => router.push("/")} className={linkClass("/")}>
          Discover
        </button>
        <button onClick={() => router.push("/search")} className={linkClass("/search")}>
          Search
        </button>
        <button onClick={() => router.push("/collections")} className={linkClass("/collections")}>
          Collections
        </button>
      </div>

      {/* Right: Profile */}
      <button
        onClick={() => router.push("/profile")}
        className={`transition-colors focus:outline-none ${
          isActive("/profile") ? "text-black" : "text-gray-400 hover:text-black"
        }`}
      >
        <User className="w-5 h-5" />
      </button>
    </nav>
  );
}
