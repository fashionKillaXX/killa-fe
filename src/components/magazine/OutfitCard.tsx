"use client";

/**
 * Editorial outfit card. Each constituent SKU lives in its own framed cell —
 * no overlapping, magazine-grid feel. Ports phase1/frontend/components/OutfitCard.tsx
 * with adapted classNames for killa-fe's existing color tokens.
 */
import Link from "next/link";
import { useState } from "react";
import { useBrainSession } from "@/contexts/BrainSessionContext";
import { emitBrainEvent, type OutfitCard as OutfitCardType, type PreviewSku } from "@/services/feed";
import { toast } from "sonner";

const COLOR_NAME_TO_HEX: Record<string, string> = {
  beige: "#D4C2A0", camel: "#B89970", ivory: "#EBE0CC", navy: "#1F2D4A",
  black: "#1A1815", white: "#F5F0E8", taupe: "#8E806C", grey: "#8C8782",
  cream: "#EFE6D2", sage: "#9DAA8E", mustard: "#C19332", maroon: "#5E1620",
  teal: "#2C5F5D", pink: "#D89BA8", lilac: "#C4A4C8", silver: "#BCB7A9",
  rust: "#A05A2C", terracotta: "#B8462C", lavender: "#B7A5C4", green: "#5C7A4F",
  red: "#9A2A1F", olive: "#6B7340", gold: "#B69049",
};

function colorOf(name?: string | null): string {
  if (!name) return "#C5BBA8";
  const n = String(name).toLowerCase().trim();
  return COLOR_NAME_TO_HEX[n] || "#C5BBA8";
}

interface Props {
  outfit: OutfitCardType & { is_saved?: boolean };
  variant?: "hero" | "standard" | "compact";
  index?: number;
  onSaved?: (outfit: OutfitCardType) => void;
  onUnsaved?: (outfit: OutfitCardType) => void;
}

export default function OutfitCard({ outfit, variant = "standard", index = 0, onSaved, onUnsaved }: Props) {
  const { requireLogin } = useBrainSession();
  const [saving, setSaving] = useState(false);
  // Initial saved state comes from the backend (`outfit.is_saved`); local state
  // tracks toggles after that.
  const [saved, setSaved] = useState<boolean>(Boolean(outfit.is_saved));
  const previewSkus = outfit.constituent_sku_previews ?? [];
  const archetypeLabel = outfit.cluster_label || (outfit.cluster || "").replace(/_/g, " ");
  const aspectClass = variant === "hero" ? "aspect-[4/5]" : "aspect-[3/4]";

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    if (saved) {
      // Toggle off — unsave
      requireLogin(async () => {
        try {
          setSaving(true);
          await emitBrainEvent({
            event_type: "unsave_outfit",
            target_type: "outfit",
            target_id: outfit.outfit_id,
            context: { position: index },
          });
          setSaved(false);
          toast.success("Removed from saved");
          onUnsaved?.(outfit);
        } catch (err: any) {
          const msg = err?.response?.data?.error || "Couldn't unsave";
          toast.error(msg);
        } finally {
          setSaving(false);
        }
      });
      return;
    }
    requireLogin(async () => {
      try {
        setSaving(true);
        await emitBrainEvent({
          event_type: "save_outfit",
          target_type: "outfit",
          target_id: outfit.outfit_id,
          context: { was_exploration: outfit.is_exploration, position: index },
        });
        setSaved(true);
        toast.success("Saved");
        onSaved?.(outfit);
      } catch (err: any) {
        const msg = err?.response?.data?.error || "Couldn't save";
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    });
  };

  return (
    <article className="group">
      <Link href={`/outfit/${outfit.outfit_id}`} className="block">
        <div className={`relative ${aspectClass} overflow-hidden`} style={{ background: "var(--cream)" }}>
          <Composition skus={previewSkus} />
          <div className="absolute top-3 left-3 z-10">
            {archetypeLabel && (
              <span
                className="inline-block px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
                style={{
                  background: "rgba(245,240,232,0.92)",
                  color: "var(--ink)",
                  fontFamily: "'General Sans', sans-serif",
                  fontWeight: 500,
                }}
              >
                {archetypeLabel}
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3 z-10">
            <span
              className="block text-[10px] px-1.5 py-0.5"
              style={{
                background: "rgba(245,240,232,0.85)",
                color: "var(--ink)",
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              N°{String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="absolute inset-0 transition-colors duration-500 pointer-events-none group-hover:bg-black/5" />
        </div>
        <div className="pt-4 pb-1">
          <h3
            className="leading-[1.05] text-balance"
            style={{
              fontFamily: "'Cirka', serif",
              fontWeight: 300,
              fontSize: variant === "hero" ? "1.875rem" : "1.25rem",
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {outfit.title}
          </h3>
          <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--muted-fg)" }}>
            {previewSkus.slice(0, 3).map((s) => s.title).filter(Boolean).join(" · ")}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-sm" style={{ color: "var(--ink)" }}>
              ₹{(outfit.total_price_inr ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px]" style={{ color: "var(--muted-fg)" }}>
              {outfit.n_items ?? previewSkus.length} pieces
            </span>
          </div>
        </div>
      </Link>
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="group/save text-[11px] uppercase tracking-wider px-3 py-1.5 transition-colors disabled:opacity-50"
          style={{
            border: "1px solid rgba(26,24,21,0.2)",
            color: saved ? "var(--muted-fg)" : "var(--ink)",
            fontFamily: "'General Sans', sans-serif",
          }}
        >
          {saving ? "…" : saved ? (
            <>
              <span className="group-hover/save:hidden">✓ Saved</span>
              <span className="hidden group-hover/save:inline">Unsave</span>
            </>
          ) : "Save"}
        </button>
      </div>
    </article>
  );
}

function Composition({ skus }: { skus: PreviewSku[] }) {
  const slice = skus.slice(0, 4);
  const n = slice.length;
  if (n === 0) {
    return <div className="absolute inset-0" style={{ background: "var(--sand)" }} />;
  }
  if (n === 1) {
    return <Frame sku={slice[0]} className="absolute inset-0" />;
  }
  if (n === 2) {
    return (
      <div className="absolute inset-0 grid grid-cols-2 gap-1" style={{ background: "var(--cream)" }}>
        <Frame sku={slice[0]} />
        <Frame sku={slice[1]} />
      </div>
    );
  }
  if (n === 3) {
    return (
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1" style={{ background: "var(--cream)" }}>
        <Frame sku={slice[0]} className="col-span-2 row-span-2" />
        <Frame sku={slice[1]} />
        <Frame sku={slice[2]} />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1" style={{ background: "var(--cream)" }}>
      {slice.map((s) => <Frame key={s.product_id} sku={s} />)}
    </div>
  );
}

function Frame({ sku, className = "" }: { sku: PreviewSku; className?: string }) {
  const fallback = colorOf(sku.color?.[0]);
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: fallback }}>
      {sku.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sku.image_url}
          alt={sku.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-[1.04]"
        />
      ) : (
        <span
          className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider"
          style={{ color: "rgba(245,240,232,0.85)", mixBlendMode: "difference" }}
        >
          {sku.slot || ""}
        </span>
      )}
    </div>
  );
}
