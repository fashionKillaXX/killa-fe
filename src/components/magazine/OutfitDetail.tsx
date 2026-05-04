"use client";

/**
 * Outfit detail — editorial spread layout.
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  CLUSTER LABEL · N PIECES                               │
 *   │  Big Serif Title                                        │
 *   │  italic story line, like a kicker                       │
 *   │                                                         │
 *   │  ₹total           [SAVE]   [MORE LIKE THIS →]           │
 *   ├─────────────────────────────────────────────────────────┤
 *   │   ┌──────────────────────────┐  ┌────────────────┐      │
 *   │   │                          │  │                │      │
 *   │   │   anchor (top / dress)   │  │   bottom or    │      │
 *   │   │   — biggest panel        │  │    next piece  │      │
 *   │   │                          │  │                │      │
 *   │   └──────────────────────────┘  └────────────────┘      │
 *   │   01 · Cream Gauze Holiday    02 · Basics Men's Pants   │
 *   │   FINESSE PICKS · ₹2,990      5FEET11 · ₹3,200          │
 *   │                                                         │
 *   │   ┌──────────┐   ┌──────────┐   ┌──────────┐            │
 *   │   │  shoes   │   │  bag     │   │  acc     │            │
 *   │   └──────────┘   └──────────┘   └──────────┘            │
 *   │   ...            ...            ...                     │
 *   └─────────────────────────────────────────────────────────┘
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useBrainSession } from "@/contexts/BrainSessionContext";
import {
  emitBrainEvent,
  getOutfit,
  type OutfitDetail as OutfitDetailType,
} from "@/services/feed";
import { useStylistDrawer } from "@/components/magazine/StylistDrawerContext";
import { toast } from "sonner";

const SLOT_RANK: Record<string, number> = {
  dress: 0, set: 0,         // anchor priority
  top: 1, outer: 2,
  bottom: 3,
  footwear: 4,
  bag: 5,
  accessory: 6,
};

function sortSkusByEditorialRole(skus: any[]): any[] {
  return [...skus].sort((a, b) => {
    const ra = SLOT_RANK[(a.tag_fingerprint?.slot || "").toLowerCase()] ?? 99;
    const rb = SLOT_RANK[(b.tag_fingerprint?.slot || "").toLowerCase()] ?? 99;
    return ra - rb;
  });
}

export default function OutfitDetail({ outfitId }: { outfitId: string }) {
  const { isReady, requireLogin } = useBrainSession();
  const { setPageContext } = useStylistDrawer();
  const [outfit, setOutfit] = useState<OutfitDetailType | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    getOutfit(outfitId).then(setOutfit).catch((e) => console.error(e));
  }, [isReady, outfitId]);

  useEffect(() => {
    if (outfit) {
      setPageContext({
        focused_outfit_id: outfit.outfit_id,
        visible_outfit_ids: [outfit.outfit_id],
        current_view: "outfit_detail",
      });
    }
  }, [outfit, setPageContext]);

  const handleSave = () =>
    requireLogin(async () => {
      if (!outfit || saved) return;
      try {
        setSaving(true);
        await emitBrainEvent({
          event_type: "save_outfit",
          target_type: "outfit",
          target_id: outfit.outfit_id,
        });
        setSaved(true);
        toast.success("Saved");
      } catch (e: any) {
        toast.error(e?.response?.data?.error || "Couldn't save");
      } finally {
        setSaving(false);
      }
    });

  if (!outfit) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-fg)" }}>
          loading…
        </p>
      </div>
    );
  }

  const story = (outfit as any).story || outfit.description || "";
  const ordered = sortSkusByEditorialRole(outfit.constituent_skus);
  // Anchor = first by rank (the dress, set, or top). Get featured size.
  const [anchor, ...rest] = ordered;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--cream)", color: "var(--ink)" }}>
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
          </Link>
          <Link
            href="/"
            className="text-[11px] uppercase tracking-wider"
            style={{ color: "var(--muted-fg)" }}
          >
            ↑ All issues
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-12">
        {/* Editorial header band */}
        <section className="border-b pb-10" style={{ borderColor: "rgba(26,24,21,0.1)" }}>
          <p
            className="text-xs uppercase tracking-[0.22em] mb-4"
            style={{ color: "var(--muted-fg)" }}
          >
            {(outfit as any).cluster_label || outfit.cluster?.replace(/_/g, " ") || "outfit"}
            <span className="mx-2">·</span>
            {outfit.constituent_skus.length} pieces
          </p>
          <h1
            className="leading-[0.92] tracking-tight text-balance max-w-4xl"
            style={{
              fontFamily: "'Cirka', serif",
              fontWeight: 300,
              fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {outfit.title}
          </h1>
          {story && (
            <p
              className="mt-5 italic leading-relaxed max-w-2xl"
              style={{
                fontFamily: "'Cirka', serif",
                fontWeight: 300,
                fontSize: "clamp(1.125rem, 1.6vw, 1.5rem)",
                color: "var(--muted-fg)",
              }}
            >
              {story}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span style={{ fontFamily: "'Cirka', serif", fontWeight: 300, fontSize: "1.875rem" }}>
              ₹{outfit.total_price_inr.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
              total · {outfit.constituent_skus.length} pieces
            </span>
            <div className="flex-1" />
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className="px-5 py-2.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-60"
              style={{
                background: saved ? "rgba(26,24,21,0.08)" : "var(--ink)",
                color: saved ? "var(--muted-fg)" : "var(--cream)",
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              {saved ? "✓ Saved" : saving ? "Saving…" : "Save outfit"}
            </button>
            <Link
              href={`/anchor/${outfit.outfit_id}`}
              className="px-5 py-2.5 text-xs uppercase tracking-wider"
              style={{
                border: `1px solid var(--ink)`,
                color: "var(--ink)",
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              More like this →
            </Link>
          </div>
        </section>

        {/* Editorial pieces — anchor large, then rest in flowing grid */}
        <section className="mt-12">
          <p
            className="text-xs uppercase tracking-[0.22em] mb-6"
            style={{ color: "var(--muted-fg)" }}
          >
            The pieces
          </p>

          {anchor && (
            <div className="mb-12 grid grid-cols-12 gap-8">
              <div className="col-span-12 md:col-span-7">
                <PieceFigure sku={anchor} index={1} variant="anchor" />
              </div>
              {rest[0] && (
                <div className="col-span-12 md:col-span-5">
                  <PieceFigure sku={rest[0]} index={2} variant="standard" />
                </div>
              )}
            </div>
          )}

          {rest.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {rest.slice(1).map((sku, i) => (
                <PieceFigure key={sku.product_id} sku={sku} index={i + 3} variant="compact" />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

interface PieceFigureProps {
  sku: any;
  index: number;
  variant: "anchor" | "standard" | "compact";
}

function PieceFigure({ sku, index, variant }: PieceFigureProps) {
  const slot = (sku.tag_fingerprint?.slot || "item").toLowerCase();
  const aspect =
    variant === "anchor" ? "aspect-[4/5]" :
    variant === "standard" ? "aspect-[3/4]" :
    "aspect-[3/4]";
  const titleClass =
    variant === "anchor" ? "text-2xl md:text-3xl" :
    variant === "standard" ? "text-xl md:text-2xl" :
    "text-base md:text-lg";
  const url = sku.url || sku.raw_attributes?.url;

  const InnerFig = (
    <figure className="group">
      <div className={`relative ${aspect} overflow-hidden`} style={{ background: "var(--sand)" }}>
        {sku.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={sku.image_url}
            alt={sku.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--sand)" }} />
        )}
        <div className="absolute top-3 left-3">
          <span
            className="inline-block px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
            style={{
              background: "rgba(245,240,232,0.92)",
              color: "var(--ink)",
              fontFamily: "'General Sans', sans-serif",
              fontWeight: 500,
            }}
          >
            {slot}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className="block text-[10px] px-1.5 py-0.5"
            style={{
              background: "rgba(245,240,232,0.85)",
              color: "var(--ink)",
              fontFamily: "'General Sans', sans-serif",
            }}
          >
            N°{String(index).padStart(2, "0")}
          </span>
        </div>
      </div>
      <figcaption className="pt-4">
        <p
          className={`leading-[1.1] line-clamp-2 ${titleClass}`}
          style={{
            fontFamily: "'Cirka', serif",
            fontWeight: 300,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {sku.title}
        </p>
        <p
          className="mt-2 text-[11px] uppercase tracking-wider"
          style={{ color: "var(--muted-fg)", fontFamily: "'General Sans', sans-serif" }}
        >
          ₹{(sku.price_inr || 0).toLocaleString("en-IN")}
        </p>
      </figcaption>
    </figure>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {InnerFig}
      </a>
    );
  }
  return InnerFig;
}
