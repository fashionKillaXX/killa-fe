"use client";

/**
 * Magazine — replaces HomePage.tsx. The first scroll any user sees.
 *
 * - Anonymous-friendly: works without login. SAVE actions open SignInSheet.
 * - Hero variant for index 0; standard for every 5th; compact for the rest.
 * - Tracks focused outfit via IntersectionObserver and feeds it as
 *   page_context.focused_outfit_id to the stylist drawer.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useBrainSession } from "@/contexts/BrainSessionContext";
import {
  getFeed,
  type FeedResponse,
  type OutfitCard as OutfitCardType,
} from "@/services/feed";
import OutfitCard from "@/components/magazine/OutfitCard";
import { useStylistDrawer } from "@/components/magazine/StylistDrawerContext";

interface Props {
  anchorId?: string;
}

export default function Magazine({ anchorId }: Props) {
  const { isReady } = useBrainSession();
  const { setPageContext } = useStylistDrawer();
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getFeed({ k: 12, anchor_id: anchorId });
      setFeed(resp);
    } catch (e) {
      console.error("Magazine feed fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [anchorId]);

  useEffect(() => {
    if (isReady) fetchFeed();
  }, [isReady, fetchFeed]);

  // Track focused outfit so the stylist drawer can use it as page_context
  useEffect(() => {
    if (!feed?.cards.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const oid = visible[0].target.getAttribute("data-outfit-id") || undefined;
          setPageContext({
            focused_outfit_id: oid,
            visible_outfit_ids: feed.cards.map((c) => c.outfit_id),
            current_view: anchorId ? "anchor_mode" : "feed",
          });
        }
      },
      { threshold: [0.3, 0.5, 0.8] },
    );
    document.querySelectorAll("[data-outfit-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [feed, anchorId, setPageContext]);

  if (!isReady || loading || !feed) {
    return <LoadingState />;
  }

  const cards = feed.cards;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--cream)", color: "var(--ink)" }}>
      <Masthead anchorId={anchorId} />

      <main className="max-w-7xl mx-auto px-6 md:px-12">
        {anchorId && (
          <div className="my-8 pb-6 border-b" style={{ borderColor: "rgba(26,24,21,0.1)" }}>
            <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "var(--muted-fg)" }}>
              Anchored mode
            </p>
            <p
              className="text-2xl"
              style={{ fontFamily: "'Cirka', serif", fontWeight: 300, color: "var(--ink)" }}
            >
              More like the outfit you tapped.
            </p>
          </div>
        )}

        {!anchorId && (
          <section className="pt-12 pb-8 border-b" style={{ borderColor: "rgba(26,24,21,0.1)" }}>
            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "var(--muted-fg)" }}>
              Issue · {new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })}
            </p>
            <h1
              className="leading-[0.95] text-balance"
              style={{
                fontFamily: "'Cirka', serif",
                fontWeight: 300,
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              On the Scroll{" "}
              <span style={{ fontStyle: "italic", color: "var(--terracotta)", fontWeight: 200 }}>
                Today
              </span>
            </h1>
            <p
              className="mt-4 max-w-xl text-sm leading-relaxed"
              style={{ color: "var(--muted-fg)" }}
            >
              An issue that adapts to you. The first scroll is shaped by who you might be;
              every save and skip refines what comes next.
            </p>
          </section>
        )}

        <section className="grid grid-cols-12 gap-x-6 gap-y-12 mt-12">
          {cards.map((card, i) => {
            const variant = i === 0 ? "hero" : i % 5 === 0 ? "standard" : "compact";
            const colSpan = {
              hero: "col-span-12 md:col-span-7 row-span-2",
              standard: "col-span-12 md:col-span-5",
              compact: "col-span-12 md:col-span-4",
            }[variant];
            return (
              <div key={card.outfit_id} data-outfit-id={card.outfit_id} className={colSpan}>
                <OutfitCard
                  outfit={card}
                  variant={variant}
                  index={i}
                  onSaved={fetchFeed}
                />
              </div>
            );
          })}
        </section>
      </main>

      {/* Debug strategy badge — bottom-left, faint */}
      <div
        className="fixed bottom-4 left-4 px-3 py-2 text-[10px] uppercase tracking-wider z-20 select-none"
        style={{
          background: "rgba(26,24,21,0.85)",
          color: "rgba(245,240,232,0.9)",
          fontFamily: "'General Sans', monospace",
        }}
      >
        ▸ {feed.feed_metadata.active_strategy} CONF{" "}
        {feed.feed_metadata.user_confidence.toFixed(2)}
      </div>
    </div>
  );
}

function Masthead({ anchorId }: { anchorId?: string }) {
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
          <span style={{ fontFamily: "'Cirka', serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--ink)" }}>
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
          {anchorId && (
            <Link href="/" className="hover:text-black">
              ↑ All issues
            </Link>
          )}
          <Link href="/collections" className="hover:text-black">
            Saved
          </Link>
          <Link href="/profile" className="hover:text-black">
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="text-center">
        <div style={{ fontFamily: "'Cirka', serif", fontWeight: 300, fontSize: "1.875rem", color: "var(--ink)" }}>
          fitcurry
        </div>
        <div className="mt-3 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-fg)" }}>
          tuning the issue<span className="animate-pulse">...</span>
        </div>
      </div>
    </div>
  );
}
