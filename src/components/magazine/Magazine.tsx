"use client";

/**
 * Magazine — replaces HomePage.tsx. The first scroll any user sees.
 *
 * - Anonymous-friendly: works without login. SAVE actions open SignInSheet.
 * - Hero variant for index 0; standard for every 5th; compact for the rest.
 * - Tracks focused outfit via IntersectionObserver and feeds it as
 *   page_context.focused_outfit_id to the stylist drawer.
 * - Infinite scroll via opaque BE cursor; page 1 always mints a fresh
 *   shuffle seed so refresh rotates the top of the feed.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useBrainSession } from "@/contexts/BrainSessionContext";
import {
  getFeed,
  type FeedMetadata,
  type OutfitCard as OutfitCardType,
} from "@/services/feed";
import OutfitCard from "@/components/magazine/OutfitCard";
import { useStylistDrawer } from "@/components/magazine/StylistDrawerContext";

interface Props {
  anchorId?: string;
}

const PAGE_SIZE = 12;

export default function Magazine({ anchorId }: Props) {
  const { isReady } = useBrainSession();
  const { setPageContext } = useStylistDrawer();

  const [cards, setCards] = useState<OutfitCardType[]>([]);
  const [meta, setMeta] = useState<FeedMetadata | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Refresh = drop cards + cursor, fetch page 1 with a new seed.
  const fetchPage1 = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const resp = await getFeed({ k: PAGE_SIZE, anchor_id: anchorId });
      setCards(resp.cards);
      setMeta(resp.feed_metadata);
      setCursor(resp.next_cursor);
      setHasMore(Boolean(resp.next_cursor) && !anchorId);
    } catch (e) {
      console.error("Magazine page1 fetch failed:", e);
    } finally {
      setLoadingInitial(false);
    }
  }, [anchorId]);

  // Load next page using the BE-issued cursor. De-duplicates by outfit_id so
  // a refresh during pagination can't double-render a card.
  const loadingMoreRef = useRef(false);
  const fetchNextPage = useCallback(async () => {
    if (loadingMoreRef.current || !cursor || anchorId) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const resp = await getFeed({ k: PAGE_SIZE, cursor });
      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.outfit_id));
        const fresh = resp.cards.filter((c) => !seen.has(c.outfit_id));
        return [...prev, ...fresh];
      });
      setMeta(resp.feed_metadata);
      setCursor(resp.next_cursor);
      setHasMore(Boolean(resp.next_cursor));
    } catch (e) {
      console.error("Magazine pagination fetch failed:", e);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [cursor, anchorId]);

  useEffect(() => {
    if (isReady) fetchPage1();
  }, [isReady, fetchPage1]);

  // IntersectionObserver-driven infinite scroll. Watches a sentinel near
  // the bottom of the grid; when it enters the viewport, fetch the next
  // page. Disposed/re-armed whenever `cursor` changes so we never miss the
  // tail of one page or trigger twice.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || !cursor) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },  // pre-fetch when within ~3 viewports
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, hasMore, fetchNextPage]);

  // Keep `visible_outfit_ids` in page_context (useful for prompts like
  // "more like the last one"), but DO NOT auto-stamp `focused_outfit_id`
  // on scroll — that turned every chat into a refine-on-the-last-visible-
  // outfit instead of a fresh compose.
  useEffect(() => {
    if (!cards.length) return;
    setPageContext({
      focused_outfit_id: null,
      visible_outfit_ids: cards.map((c) => c.outfit_id),
      current_view: anchorId ? "anchor_mode" : "feed",
    });
  }, [cards, anchorId, setPageContext]);

  if (!isReady || loadingInitial) {
    return <LoadingState />;
  }

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
              The{" "}
              <span style={{ fontStyle: "italic", color: "var(--terracotta)", fontWeight: 200 }}>
                Daily.
              </span>
            </h1>
            <p
              className="mt-4 max-w-xl text-sm leading-relaxed"
              style={{ color: "var(--muted-fg)" }}
            >
              A new issue every time you open this. Built from labels the algorithm
              doesn&rsquo;t know about yet &mdash; and increasingly, built for you.
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
                  onSaved={fetchPage1}
                />
              </div>
            );
          })}
        </section>

        {/* Pagination sentinel + status banner */}
        {hasMore ? (
          <div ref={sentinelRef} className="mt-16 mb-8 flex justify-center">
            {loadingMore ? (
              <span
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--muted-fg)" }}
              >
                loading more<span className="animate-pulse">...</span>
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-50">
                ↓ scroll for more
              </span>
            )}
          </div>
        ) : cards.length > 0 ? (
          <div className="mt-16 mb-8 flex flex-col items-center gap-3">
            <span
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: "var(--muted-fg)" }}
            >
              That's the end of this issue.
            </span>
            <button
              onClick={fetchPage1}
              className="text-xs uppercase tracking-[0.2em] underline opacity-70 hover:opacity-100"
            >
              ↻ Pull a fresh shuffle
            </button>
          </div>
        ) : null}
      </main>

      {/* Debug strategy badge — dev-only. Shows active strategy + confidence
          + cards-loaded/pool + familiar-impressions. Hidden on production
          because it leaks internal vocab and looks "AI-app"-y to end users. */}
      {process.env.NODE_ENV === "development" && (
        <div
          className="fixed bottom-4 left-4 px-3 py-2 text-[10px] uppercase tracking-wider z-20 select-none"
          style={{
            background: "rgba(26,24,21,0.85)",
            color: "rgba(245,240,232,0.9)",
            fontFamily: "'General Sans', monospace",
          }}
        >
          ▸ {meta?.active_strategy ?? "loading"} CONF{" "}
          {(meta?.user_confidence ?? 0).toFixed(2)}
          {meta?.candidate_pool ? ` · ${cards.length}/${meta.candidate_pool}` : ""}
          {meta?.n_familiar_in_page != null && meta.n_familiar_in_page > 0
            ? ` · ${meta.n_familiar_in_page}↺`
            : ""}
        </div>
      )}
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
            an indie style daily
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
          pulling the issue<span className="animate-pulse">...</span>
        </div>
      </div>
    </div>
  );
}
