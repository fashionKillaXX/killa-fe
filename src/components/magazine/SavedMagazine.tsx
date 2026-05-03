"use client";

/**
 * Editorial saved page — the Phase 1 design over the brain /saved endpoint.
 * Replaces the legacy CollectionsPage (which used /api/collections/ + the old
 * BottomNav/DesktopNav). Brain saves now actually surface here.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useBrainSession } from "@/contexts/BrainSessionContext";
import { getBrainSaved, type OutfitCard, type SavedResponse } from "@/services/feed";
import OutfitCardComp from "@/components/magazine/OutfitCard";

export default function SavedMagazine() {
  const { isAuthenticated } = useAuth();
  const { isReady } = useBrainSession();
  const [data, setData] = useState<SavedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getBrainSaved()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.error || "Couldn't load your wardrobe"))
      .finally(() => setLoading(false));
  }, [isReady, isAuthenticated]);

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--cream)", color: "var(--ink)" }}>
      <Masthead />

      <main className="max-w-7xl mx-auto px-6 md:px-12">
        <section className="pt-12 pb-8 border-b" style={{ borderColor: "rgba(26,24,21,0.1)" }}>
          <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "var(--muted-fg)" }}>
            Your wardrobe · in progress
          </p>
          <h1
            className="leading-[0.95] text-balance"
            style={{
              fontFamily: "'Cirka', serif",
              fontWeight: 300,
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Saved <span style={{ fontStyle: "italic", color: "var(--terracotta)", fontWeight: 200 }}>looks</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
            Outfits you've saved. Each save also tells the stylist what you like —
            the feed adapts in the background.
          </p>
        </section>

        {!isAuthenticated && (
          <SignInPrompt />
        )}

        {isAuthenticated && loading && (
          <p className="mt-12 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-fg)" }}>
            loading<span className="animate-pulse">...</span>
          </p>
        )}

        {isAuthenticated && error && (
          <p className="mt-12 text-sm" style={{ color: "var(--muted-fg)" }}>
            {error}
          </p>
        )}

        {isAuthenticated && !loading && data && data.saved_outfits.length === 0 && data.saved_skus.length === 0 && (
          <EmptyState />
        )}

        {data && data.saved_outfits.length > 0 && (
          <section className="mt-12">
            <h2
              className="mb-6"
              style={{ fontFamily: "'Cirka', serif", fontWeight: 300, fontSize: "1.875rem" }}
            >
              Outfits{" "}
              <span className="text-sm ml-2" style={{ color: "var(--muted-fg)" }}>
                ({data.saved_outfits.length})
              </span>
            </h2>
            <div className="grid grid-cols-12 gap-x-6 gap-y-12">
              {data.saved_outfits.map((card: OutfitCard, i) => (
                <div key={card.outfit_id} className="col-span-12 md:col-span-6 lg:col-span-4">
                  <OutfitCardComp outfit={card} variant="compact" index={i} />
                </div>
              ))}
            </div>
          </section>
        )}

        {data && data.saved_skus.length > 0 && (
          <section className="mt-16 border-t pt-10" style={{ borderColor: "rgba(26,24,21,0.1)" }}>
            <h2
              className="mb-6"
              style={{ fontFamily: "'Cirka', serif", fontWeight: 300, fontSize: "1.875rem" }}
            >
              Pieces{" "}
              <span className="text-sm ml-2" style={{ color: "var(--muted-fg)" }}>
                ({data.saved_skus.length})
              </span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {data.saved_skus.map((sku: any) => (
                <div key={sku.product_id} className="group">
                  <div className="aspect-[3/4] relative overflow-hidden" style={{ background: "var(--sand)" }}>
                    {sku.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={sku.image_url}
                        alt={sku.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: "var(--sand)" }} />
                    )}
                  </div>
                  <p
                    className="mt-3 leading-tight line-clamp-2"
                    style={{ fontFamily: "'Cirka', serif", fontWeight: 300, color: "var(--ink)" }}
                  >
                    {sku.title}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--ink)" }}>
                    ₹{(sku.price_inr || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Masthead() {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-sm"
      style={{
        borderColor: "rgba(26,24,21,0.1)",
        background: "rgba(245,240,232,0.85)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 flex items-baseline justify-between">
        <Link href="/" className="flex items-baseline gap-3">
          <span style={{ fontFamily: "'Cirka', serif", fontWeight: 700, fontSize: "1.25rem" }}>
            fitcurry
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.2em] hidden md:inline"
            style={{ color: "var(--muted-fg)" }}
          >
            fashion intelligence
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-[11px] uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
          <Link href="/" className="hover:text-black">
            ↑ All issues
          </Link>
          <Link href="/profile" className="hover:text-black">
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SignInPrompt() {
  return (
    <div className="mt-16 max-w-md">
      <p
        className="text-2xl leading-snug"
        style={{ fontFamily: "'Cirka', serif", fontWeight: 300, color: "var(--ink)" }}
      >
        Sign in to see what you've saved.
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
        Saves are personal — every save also reshapes the feed. Sign in to keep them.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block px-5 py-2.5 text-xs uppercase tracking-wider"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        ← Back to the issue
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 max-w-md">
      <p
        className="text-2xl leading-snug"
        style={{ fontFamily: "'Cirka', serif", fontWeight: 300, color: "var(--ink)" }}
      >
        Nothing saved yet.
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
        Tap "Save" on a card or detail page. Saved looks land here, and every save reshapes the feed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block px-5 py-2.5 text-xs uppercase tracking-wider"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        Browse the issue →
      </Link>
    </div>
  );
}
