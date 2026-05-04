"use client";

/**
 * /chat used to render a standalone ChatPage. Phase 1 replaces this with
 * an always-on stylist drawer mounted in Providers. Hitting this route
 * sends the user to the magazine and opens the drawer.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStylistDrawer } from "@/components/magazine/StylistDrawerContext";

export default function Chat() {
  const router = useRouter();
  const { setOpen } = useStylistDrawer();

  useEffect(() => {
    setOpen(true);
    router.replace("/");
  }, [router, setOpen]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-fg)" }}>
        opening the stylist…
      </p>
    </div>
  );
}
