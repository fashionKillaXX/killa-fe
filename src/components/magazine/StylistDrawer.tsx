"use client";

/**
 * StylistDrawer — always-on, mounted globally. Floating "Ask the stylist" button
 * bottom-right. Opens a drawer with chat that is page_context-aware (knows which
 * outfit you're focused on).
 *
 * Replaces the standalone /chat page. Keeps existing /chat route working via a
 * redirect so the BottomNav link doesn't 404.
 */
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { chatWithStylist, type OutfitCard } from "@/services/feed";
import { useStylistDrawer } from "@/components/magazine/StylistDrawerContext";
import { toast } from "sonner";

interface Turn {
  user: string;
  assistant: string;
  feed?: OutfitCard[];
  intent?: any;
  topOutfitId?: string;
}

export default function StylistDrawer() {
  const { open, setOpen, pageContext } = useStylistDrawer();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const send = async (msg: string) => {
    if (!msg.trim() || thinking) return;
    const userMsg = msg.trim();
    setInput("");
    setThinking(true);
    setTurns((prev) => [...prev, { user: userMsg, assistant: "" }]);
    try {
      const r = await chatWithStylist({ message: userMsg, page_context: pageContext });
      setTurns((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          user: userMsg,
          assistant: r.assistant_message,
          feed: r.feed,
          intent: r.parsed_intent,
          topOutfitId: r.suggested_anchor_id || undefined,
        };
        return updated;
      });
    } catch (e: any) {
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

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 px-5 py-3 shadow-lg flex items-center gap-2"
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

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/30"
            aria-label="Close stylist drawer"
          />
          <aside
            className="w-full max-w-md flex flex-col"
            style={{ background: "var(--cream)", color: "var(--ink)" }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 border-b flex items-baseline justify-between"
              style={{ borderColor: "rgba(26,24,21,0.1)" }}
            >
              <div>
                <h2 style={{ fontFamily: "'Cirka', serif", fontWeight: 300, fontSize: "1.5rem" }}>
                  The Stylist
                </h2>
                <p className="text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: "var(--muted-fg)" }}>
                  {pageContext.current_view === "anchor_mode"
                    ? "Anchored to this outfit"
                    : pageContext.focused_outfit_id
                    ? "Reading the outfit you're on"
                    : "Scrolling the feed"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl"
                style={{ color: "var(--muted-fg)" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {turns.length === 0 && (
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
                    Tell me what you're looking for. I can see what you're scrolling, so you can
                    say "make this more office" or "something cheaper but similar" and I'll get it.
                  </p>
                  <div className="mt-6 space-y-2">
                    <p
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: "var(--muted-fg)" }}
                    >
                      Try
                    </p>
                    {[
                      "wedding guest under 5k",
                      "make this more office",
                      "more like this but cheaper",
                      "something for evening",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="block text-sm hover:underline italic"
                        style={{ fontFamily: "'Cirka', serif", color: "var(--ink)" }}
                      >
                        “{s}”
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((t, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-sm" style={{ color: "var(--muted-fg)" }}>
                    {t.user}
                  </p>
                  {t.assistant && (
                    <div className="space-y-3">
                      <p
                        className="leading-snug italic"
                        style={{
                          fontFamily: "'Cirka', serif",
                          fontWeight: 300,
                          fontSize: "1.125rem",
                          color: "var(--ink)",
                        }}
                      >
                        {t.assistant}
                      </p>
                      {t.intent && (
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
                          heard:
                          {t.intent.occasion && ` ${t.intent.occasion}`}
                          {t.intent.price_max && ` · under ₹${t.intent.price_max.toLocaleString("en-IN")}`}
                          {t.intent.aesthetic?.length > 0 && ` · ${t.intent.aesthetic.join(", ")}`}
                        </p>
                      )}
                      {t.feed && t.feed.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {t.feed.slice(0, 4).map((o) => {
                            const heroImg = o.constituent_sku_previews?.find((p) => p.image_url)?.image_url;
                            return (
                              <Link
                                key={o.outfit_id}
                                href={`/outfit/${o.outfit_id}`}
                                className="group block"
                                onClick={() => setOpen(false)}
                              >
                                <div className="aspect-[3/4] relative overflow-hidden" style={{ background: "var(--sand)" }}>
                                  {heroImg && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={heroImg} alt={o.title} className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <p
                                  className="mt-2 text-sm leading-tight line-clamp-2"
                                  style={{ fontFamily: "'Cirka', serif", fontWeight: 300, color: "var(--ink)" }}
                                >
                                  {o.title}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-fg)" }}>
                                  ₹{(o.total_price_inr ?? 0).toLocaleString("en-IN")}
                                </p>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                      {t.topOutfitId && (
                        <Link
                          href={`/anchor/${t.topOutfitId}`}
                          onClick={() => setOpen(false)}
                          className="inline-block text-xs uppercase tracking-wider hover:underline"
                          style={{ color: "var(--terracotta)" }}
                        >
                          Show more like the top one →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {thinking && (
                <p
                  className="italic"
                  style={{ fontFamily: "'Cirka', serif", fontSize: "1.125rem", color: "var(--muted-fg)" }}
                >
                  thinking<span className="animate-pulse">...</span>
                </p>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t p-4 flex gap-2"
              style={{ borderColor: "rgba(26,24,21,0.1)" }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me what you want..."
                className="flex-1 bg-transparent border-0 border-b focus:outline-none px-2 py-2 text-sm"
                style={{ borderColor: "rgba(26,24,21,0.2)", color: "var(--ink)" }}
                disabled={thinking}
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="text-xs uppercase tracking-wider px-3 disabled:opacity-50"
                style={{ color: "var(--terracotta)" }}
              >
                Ask
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
