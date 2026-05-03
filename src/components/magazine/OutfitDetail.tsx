"use client";

/**
 * Outfit detail page — full SKU grid + "More like this" anchor link + save.
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

const COLOR_NAME_TO_HEX: Record<string, string> = {
  beige: "#D4C2A0", camel: "#B89970", ivory: "#EBE0CC", navy: "#1F2D4A",
  black: "#1A1815", white: "#F5F0E8", taupe: "#8E806C", grey: "#8C8782",
  cream: "#EFE6D2",
};
const colorOf = (name?: string) => COLOR_NAME_TO_HEX[(name || "").toLowerCase()] || "#C5BBA8";

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

  const heroSku = outfit.constituent_skus.find((s) => s.image_url);

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
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 md:col-span-7">
            <p
              className="text-xs uppercase tracking-[0.2em] mb-3"
              style={{ color: "var(--muted-fg)" }}
            >
              {outfit.cluster?.replace(/_/g, " ") || "outfit"} ·{" "}
              {outfit.constituent_skus.length} pieces
            </p>
            <h1
              className="leading-[0.95] text-balance"
              style={{
                fontFamily: "'Cirka', serif",
                fontWeight: 300,
                fontSize: "clamp(2.5rem, 5.5vw, 3.75rem)",
                letterSpacing: "-0.02em",
              }}
            >
              {outfit.title}
            </h1>
            {outfit.description && (
              <p className="mt-4 text-lg leading-relaxed max-w-xl" style={{ color: "var(--muted-fg)" }}>
                {outfit.description}
              </p>
            )}
            <div className="mt-6 flex items-baseline gap-4">
              <span style={{ fontSize: "1.5rem" }}>
                ₹{outfit.total_price_inr.toLocaleString("en-IN")}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-fg)" }}>
                total cost
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={saved || saving}
                className="px-5 py-2.5 text-sm uppercase tracking-wider transition-colors disabled:opacity-60"
                style={{
                  background: saved ? "rgba(26,24,21,0.1)" : "var(--ink)",
                  color: saved ? "var(--muted-fg)" : "var(--cream)",
                }}
              >
                {saved ? "✓ Saved" : saving ? "Saving…" : "Save outfit"}
              </button>
              <Link
                href={`/anchor/${outfit.outfit_id}`}
                className="px-5 py-2.5 text-sm uppercase tracking-wider"
                style={{
                  border: `1px solid var(--ink)`,
                  color: "var(--ink)",
                }}
              >
                More like this →
              </Link>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5">
            <div className="aspect-[4/5] relative overflow-hidden" style={{ background: "var(--sand)" }}>
              {heroSku?.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={heroSku.image_url} alt={heroSku.title} className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        </div>

        <section className="border-t pt-10" style={{ borderColor: "rgba(26,24,21,0.1)" }}>
          <h2 style={{ fontFamily: "'Cirka', serif", fontWeight: 300, fontSize: "1.875rem" }}>The pieces</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 mt-6">
            {outfit.constituent_skus.map((sku) => (
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
                    <div
                      className="w-full h-full"
                      style={{ background: colorOf(sku.tag_fingerprint?.color_family?.[0]) }}
                    />
                  )}
                  <div className="absolute top-2 left-2">
                    <span
                      className="text-[9px] uppercase tracking-wider px-1.5 py-0.5"
                      style={{ background: "rgba(245,240,232,0.85)", color: "var(--ink)" }}
                    >
                      {sku.tag_fingerprint?.slot || "item"}
                    </span>
                  </div>
                </div>
                <div className="pt-3">
                  <p
                    className="leading-tight line-clamp-2"
                    style={{ fontFamily: "'Cirka', serif", fontWeight: 300, color: "var(--ink)" }}
                  >
                    {sku.title}
                  </p>
                  <p className="text-sm mt-1">₹{(sku.price_inr || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
