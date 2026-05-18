"use client";

/**
 * StylistOverlay — full-screen chat takeover.
 *
 * Replaces the side-drawer pattern. The chat is its own focused experience:
 * slides up from the bottom (300ms), occupies 100vh, has a top bar, an
 * anchored-outfit chip when applicable, scrollable chat history with one
 * BIG composed outfit per turn, and a sticky input.
 *
 * UX shape:
 *   ┌───────────────────────────────────────────────┐
 *   │  ← back   The Stylist                       × │  top bar
 *   │  ┃ Refining: Clean Girl — Shirt look       × │  anchored chip (optional)
 *   ├───────────────────────────────────────────────┤
 *   │                                                │
 *   │  [user message]                                │
 *   │  italic story line                             │
 *   │  ┌─────────────────────────────────┐           │
 *   │  │     COMPOSED OUTFIT CARD        │           │
 *   │  │     (anchor + slots, big)       │           │
 *   │  │  [Anchor] [Save] [Refine]       │           │
 *   │  └─────────────────────────────────┘           │
 *   │                                                │
 *   ├───────────────────────────────────────────────┤
 *   │  [Tell me what you want…]              [Send] │  sticky input
 *   └───────────────────────────────────────────────┘
 *
 * Component still keeps the floating "Ask the stylist" trigger so it can
 * be opened from anywhere on the site.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  chatWithStylist,
  emitBrainEvent,
  getOutfit,
  type OutfitCard,
  type OutfitDetail,
  type PageContext,
} from "@/services/feed";
import { useStylistDrawer } from "@/components/magazine/StylistDrawerContext";
import { useBrainSession } from "@/contexts/BrainSessionContext";
import { toast } from "sonner";

interface Turn {
  user: string;
  assistant?: string;
  outfit?: OutfitCard;
  refining?: boolean;
}

export default function StylistOverlay() {
  const { open, setOpen, pageContext, setPageContext } = useStylistDrawer();
  const { requireLogin } = useBrainSession();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  // Mounted state lets us play the slide-up animation cleanly on open/close
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Mount + animation lifecycle + fresh-chat-on-open.
  // Every open clears the prior conversation. The Stylist is meant to be a
  // single focused exchange about the current anchor; if the user wants to
  // continue a thread, they should use Refine within the conversation, not
  // reopen the overlay.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setTurns([]);
      setInput("");
      // input focus after the slide-up settles
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    } else if (mounted) {
      // Let the slide-down play before unmounting
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  // Auto-scroll to latest turn
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const _doSend = async (userMsg: string) => {
    setThinking(true);
    setTurns((prev) => [...prev, { user: userMsg }]);
    try {
      const r = await chatWithStylist({ message: userMsg, page_context: pageContext });
      setTurns((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          user: userMsg,
          assistant: r.assistant_message,
          outfit: r.top_outfit ?? undefined,
        };
        return updated;
      });
    } catch (e: any) {
      if (e?.response?.status === 401 && e?.response?.data?.auth_required) {
        setTurns((prev) => prev.slice(0, -1));
        requireLogin(() => _doSend(userMsg), "chat");
        return;
      }
      setTurns((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          user: userMsg,
          assistant: "Sorry, something broke on my end. Try again?",
        };
        return updated;
      });
      console.error("Chat failed:", e);
      toast.error("Chat is having a moment.");
    } finally {
      setThinking(false);
    }
  };

  const send = (msg: string) => {
    if (!msg.trim() || thinking) return;
    setInput("");
    requireLogin(() => _doSend(msg.trim()), "chat");
  };

  // Refine: pin the just-composed outfit as the chat's anchor so the next
  // message triggers retrieval-from-corpus (cluster shift / piece swap),
  // not a fresh compose. The BE chat endpoint routes by page_context.
  const refineOnOutfit = useCallback(
    (outfitId: string, outfitTitle: string) => {
      setPageContext({
        ...pageContext,
        focused_outfit_id: outfitId,
        current_view: "anchor_mode",
      });
      toast(`Refining "${outfitTitle.slice(0, 36)}…"`, { duration: 3500 });
      setTimeout(() => inputRef.current?.focus(), 80);
    },
    [pageContext, setPageContext],
  );

  const clearAnchor = () => {
    setPageContext({ ...pageContext, focused_outfit_id: null, current_view: "feed" });
  };

  return (
    <>
      {/* Floating trigger — sits across all routes */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 px-5 py-3 shadow-lg flex items-center gap-2"
        style={{
          background: "var(--ink)",
          color: "var(--cream)",
          fontFamily: "'Cirka', serif",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: "1rem",
        }}
        aria-label="Open stylist chat"
      >
        Ask the stylist <span aria-hidden>→</span>
      </button>

      {/* Full-screen overlay */}
      {mounted && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: "var(--cream)",
            color: "var(--ink)",
            transform: open ? "translateY(0)" : "translateY(100%)",
            transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          aria-modal="true"
          role="dialog"
        >
          {/* Top bar */}
          <header
            className="border-b"
            style={{ borderColor: "rgba(26,24,21,0.1)" }}
          >
            <div className="max-w-4xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
              <button
                onClick={() => setOpen(false)}
                className="text-xs uppercase tracking-[0.2em] hover:opacity-70"
                style={{ color: "var(--muted-fg)", fontFamily: "'General Sans', sans-serif" }}
              >
                ← back
              </button>
              <h2
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  fontFamily: "'Cirka', serif",
                  fontWeight: 300,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.01em",
                }}
              >
                The Stylist
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none"
                style={{ color: "var(--muted-fg)" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </header>

          {/* Anchored chip (when refining a specific outfit) */}
          {pageContext.focused_outfit_id && (
            <AnchoredOutfitChip
              outfitId={pageContext.focused_outfit_id}
              currentView={pageContext.current_view ?? "feed"}
              onClear={clearAnchor}
            />
          )}

          {/* Body */}
          <div ref={scrollerRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 space-y-12">
              {turns.length === 0 && <EmptyStatePrompts onPick={send} />}

              {turns.map((t, i) => (
                <ChatTurn
                  key={i}
                  turn={t}
                  onAnchor={(o) => {
                    setOpen(false);
                    // Navigate via Link below; we just close the overlay first
                  }}
                  onRefine={(o) => refineOnOutfit(o.outfit_id, o.title)}
                />
              ))}

              {thinking && (
                <p
                  className="italic"
                  style={{
                    fontFamily: "'Cirka', serif",
                    fontWeight: 300,
                    fontSize: "1.5rem",
                    color: "var(--muted-fg)",
                  }}
                >
                  thinking<span className="animate-pulse">…</span>
                </p>
              )}
            </div>
          </div>

          {/* Input — sticky bottom */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t"
            style={{
              borderColor: "rgba(26,24,21,0.1)",
              background: "var(--cream)",
            }}
          >
            <div className="max-w-3xl mx-auto px-6 md:px-12 py-5 flex gap-3 items-baseline">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  pageContext.focused_outfit_id
                    ? "Tell me what to change about this outfit…"
                    : "Tell me what you want to wear…"
                }
                className="flex-1 bg-transparent border-0 border-b focus:outline-none px-2 py-3 text-base"
                style={{
                  borderColor: "rgba(26,24,21,0.2)",
                  color: "var(--ink)",
                  fontFamily: "'Cirka', serif",
                  fontWeight: 300,
                  fontSize: "1.25rem",
                }}
                disabled={thinking}
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="text-xs uppercase tracking-wider px-4 py-2 disabled:opacity-40 transition-opacity"
                style={{
                  background: "var(--ink)",
                  color: "var(--cream)",
                  fontFamily: "'General Sans', sans-serif",
                }}
              >
                Send →
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Empty-state suggestions
// ============================================================================

function EmptyStatePrompts({ onPick }: { onPick: (s: string) => void }) {
  const prompts = [
    "Wedding guest under 5k",
    "Saree for sangeet",
    "Streetwear hoodie outfit",
    "Date night dress",
    "Office casual look",
    "Lehenga for diwali",
  ];
  return (
    <div className="space-y-6">
      <p
        className="leading-snug max-w-xl"
        style={{
          fontFamily: "'Cirka', serif",
          fontWeight: 300,
          fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
          color: "var(--ink)",
          letterSpacing: "-0.02em",
        }}
      >
        Tell me what you want to wear,
        <br />
        <span className="italic" style={{ color: "var(--muted-fg)" }}>
          and I'll build you an outfit.
        </span>
      </p>
      <div className="space-y-2">
        <p
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: "var(--muted-fg)" }}
        >
          Try
        </p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="px-3 py-2 text-sm hover:bg-black/5 transition-colors"
              style={{
                border: "1px solid rgba(26,24,21,0.2)",
                color: "var(--ink)",
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Anchored outfit chip — what the chat is currently "talking about"
// ============================================================================

function AnchoredOutfitChip({
  outfitId,
  currentView,
  onClear,
}: {
  outfitId: string;
  currentView: string;
  onClear: () => void;
}) {
  const [outfit, setOutfit] = useState<OutfitDetail | null>(null);
  useEffect(() => {
    let cancelled = false;
    getOutfit(outfitId)
      .then((o) => {
        if (!cancelled) setOutfit(o);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [outfitId]);

  if (!outfit) {
    return (
      <div
        className="border-b"
        style={{ borderColor: "rgba(26,24,21,0.1)", background: "rgba(184,70,44,0.04)" }}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-3">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-fg)" }}>
            loading anchor…
          </p>
        </div>
      </div>
    );
  }

  const heroSku = outfit.constituent_skus.find((s: any) => s.image_url);
  const verb = currentView === "anchor_mode" ? "Refining" : "Talking about";

  return (
    <div
      className="border-b"
      style={{ borderColor: "rgba(26,24,21,0.1)", background: "rgba(184,70,44,0.04)" }}
    >
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-3 flex items-center gap-3">
        <span
          className="block w-1 self-stretch"
          style={{ background: "var(--terracotta)" }}
        />
        {heroSku?.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={heroSku.image_url}
            alt={outfit.title}
            className="w-12 h-14 object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] uppercase tracking-[0.22em]"
            style={{ color: "var(--muted-fg)" }}
          >
            {verb}
          </p>
          <p
            className="truncate text-base leading-tight"
            style={{ fontFamily: "'Cirka', serif", fontWeight: 300, color: "var(--ink)" }}
          >
            {outfit.title}
          </p>
        </div>
        <button
          onClick={onClear}
          className="text-xs uppercase tracking-wider px-2"
          style={{ color: "var(--muted-fg)", fontFamily: "'General Sans', sans-serif" }}
          title="Clear anchor — start a fresh compose"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// One chat turn — user line + assistant line + ONE big composed outfit card
// ============================================================================

function ChatTurn({
  turn,
  onAnchor,
  onRefine,
}: {
  turn: Turn;
  onAnchor: (o: OutfitCard) => void;
  onRefine: (o: OutfitCard) => void;
}) {
  return (
    <div className="space-y-6">
      {/* User message — small, muted */}
      <p
        className="text-sm"
        style={{ color: "var(--muted-fg)", fontFamily: "'General Sans', sans-serif" }}
      >
        you · {turn.user}
      </p>

      {/* Assistant story line — italic, larger */}
      {turn.assistant && (
        <p
          className="italic leading-snug max-w-2xl"
          style={{
            fontFamily: "'Cirka', serif",
            fontWeight: 300,
            fontSize: "clamp(1.25rem, 2vw, 1.625rem)",
            color: "var(--ink)",
          }}
        >
          {turn.assistant}
        </p>
      )}

      {turn.outfit && (
        <ComposedOutfitCard outfit={turn.outfit} onAnchor={onAnchor} onRefine={onRefine} />
      )}
    </div>
  );
}

// ============================================================================
// The big composed-outfit card (one per turn)
// ============================================================================

function ComposedOutfitCard({
  outfit,
  onAnchor,
  onRefine,
}: {
  outfit: OutfitCard;
  onAnchor: (o: OutfitCard) => void;
  onRefine: (o: OutfitCard) => void;
}) {
  const { requireLogin } = useBrainSession();
  const previews = outfit.constituent_sku_previews || [];
  const hero = previews[0];
  const rest = previews.slice(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const archetypeLabel = outfit.cluster_label || (outfit.cluster || "").replace(/_/g, " ");
  const story = outfit.story || "";

  const handleSave = () => {
    if (saved || saving) return;
    requireLogin(async () => {
      try {
        setSaving(true);
        await emitBrainEvent({
          event_type: "save_outfit",
          target_type: "outfit",
          target_id: outfit.outfit_id,
          context: { source: "chat" },
        });
        setSaved(true);
        toast.success("Saved");
      } catch (e: any) {
        toast.error(e?.response?.data?.error || "Couldn't save");
      } finally {
        setSaving(false);
      }
    });
  };

  return (
    <article
      className="border max-w-3xl"
      style={{
        background: "rgba(245,240,232,0.6)",
        borderColor: "rgba(26,24,21,0.12)",
      }}
    >
      <div className="grid grid-cols-12 gap-4 p-5">
        {/* Hero image */}
        <div className="col-span-12 md:col-span-6">
          <Link
            href={`/outfit/${outfit.outfit_id}`}
            className="block"
            onClick={() => onAnchor(outfit)}
          >
            <div
              className="aspect-[4/5] relative overflow-hidden"
              style={{ background: "var(--sand)" }}
            >
              {hero?.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={hero.image_url}
                  alt={outfit.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              )}
              {archetypeLabel && (
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
                    {archetypeLabel}
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Right: title + story + pieces grid + actions */}
        <div className="col-span-12 md:col-span-6 flex flex-col">
          <h3
            className="leading-[1.05] text-balance"
            style={{
              fontFamily: "'Cirka', serif",
              fontWeight: 300,
              fontSize: "clamp(1.5rem, 2.4vw, 2rem)",
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {outfit.title}
          </h3>
          {story && (
            <p
              className="mt-2 italic leading-snug"
              style={{
                fontFamily: "'Cirka', serif",
                fontWeight: 300,
                fontSize: "0.95rem",
                color: "var(--muted-fg)",
              }}
            >
              {story}
            </p>
          )}

          {rest.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {rest.slice(0, 3).map((s) => (
                <div key={s.product_id}>
                  <div
                    className="aspect-square relative overflow-hidden"
                    style={{ background: "var(--sand)" }}
                  >
                    {s.image_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={s.image_url}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p
                    className="mt-1 text-[10px] uppercase tracking-wider"
                    style={{ color: "var(--muted-fg)", fontFamily: "'General Sans', sans-serif" }}
                  >
                    {s.slot}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span
              style={{
                fontFamily: "'Cirka', serif",
                fontWeight: 300,
                fontSize: "1.5rem",
              }}
            >
              ₹{(outfit.total_price_inr ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px]" style={{ color: "var(--muted-fg)" }}>
              {outfit.n_items} pieces
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/anchor/${outfit.outfit_id}`}
              onClick={() => onAnchor(outfit)}
              className="px-4 py-2 text-xs uppercase tracking-wider transition-colors"
              style={{
                background: "var(--ink)",
                color: "var(--cream)",
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              Anchor on this →
            </Link>
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className="px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-60"
              style={{
                border: "1px solid var(--ink)",
                color: saved ? "var(--muted-fg)" : "var(--ink)",
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
            </button>
            <button
              onClick={() => onRefine(outfit)}
              className="px-4 py-2 text-xs uppercase tracking-wider"
              style={{
                color: "var(--terracotta)",
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              Refine →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
