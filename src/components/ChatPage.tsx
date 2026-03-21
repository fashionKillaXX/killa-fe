"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import {
  ChatSession,
  ChatChunk,
  listChatSessions,
  createChatSession,
  getChatSession,
  deleteChatSession,
  sendChatMessage,
} from "@/services/chat";
import { saveOutfit } from "@/services/outfits";
import { SaveToCollectionSheet } from "@/components/SaveToCollectionSheet";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TextBlock { kind: "text"; content: string }
interface OutfitProduct {
  productId: string; slot: string; name: string;
  productImageUrl: string; price: number | null; brand: string; url: string;
}
interface OutfitBlock {
  kind: "outfit"; name: string; occasion: string; products: OutfitProduct[];
}
type ContentBlock = TextBlock | OutfitBlock;

// ---------------------------------------------------------------------------
// Outfit Card — magazine horizontal scroll layout
// ---------------------------------------------------------------------------
function OutfitCard({ outfit }: { outfit: OutfitBlock }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProduct, setSaveProduct] = useState<OutfitProduct | null>(null);

  const handleSaveOutfit = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    try {
      await saveOutfit({
        name: outfit.name,
        occasion: outfit.occasion,
        products: outfit.products.map((p) => ({ productId: p.productId, slot: p.slot })),
      });
      setIsSaved(true);
      toast.success("Outfit saved to your collection");
    } catch {
      toast.error("Failed to save outfit");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="my-3 rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        {/* Card header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">{outfit.occasion || "Outfit"}</p>
            <h3 className="text-sm text-gray-900 leading-snug" style={{ fontWeight: 480, letterSpacing: "-0.01em" }}>
              {outfit.name}
            </h3>
          </div>
          <button
            onClick={handleSaveOutfit}
            disabled={isSaving}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-all duration-200 ${
              isSaved
                ? "bg-gray-100 text-gray-700 border border-gray-200"
                : "bg-black text-white hover:bg-gray-800 active:scale-95"
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {isSaved ? "Saved" : "Save look"}
          </button>
        </div>

        {/* Horizontal scrollable product strip */}
        <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none">
          {outfit.products.map((p) => (
            <div key={p.productId} className="flex-shrink-0 w-[120px] group">
              <button
                onClick={() => router.push(`/products/${p.productId}`)}
                className="relative w-[120px] h-[156px] rounded-xl overflow-hidden bg-gray-100 block mb-2"
              >
                {p.productImageUrl ? (
                  <img
                    src={p.productImageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
                {/* Save individual product */}
                <button
                  onClick={(e) => { e.stopPropagation(); setSaveProduct(p); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                {/* Slot tag */}
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                  {p.slot}
                </span>
              </button>
              <button
                onClick={() => router.push(`/products/${p.productId}`)}
                className="text-left w-full group"
              >
                <p className="text-[11px] text-gray-900 line-clamp-2 leading-tight" style={{ fontWeight: 440 }}>
                  {p.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{p.brand}</p>
                {p.price != null && (
                  <p className="text-[11px] text-gray-900 mt-0.5" style={{ fontWeight: 520 }}>
                    ₹{Number(p.price).toLocaleString("en-IN")}
                  </p>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {saveProduct && (
        <SaveToCollectionSheet
          open={!!saveProduct}
          onOpenChange={(open) => !open && setSaveProduct(null)}
          productId={saveProduct.productId}
          productName={saveProduct.name}
          savedCollectionIds={[]}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Chat bubble
// ---------------------------------------------------------------------------
function ChatBubble({ role, blocks }: { role: "user" | "assistant"; blocks: ContentBlock[] }) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-black text-white rounded-2xl rounded-br-[6px] px-4 py-3">
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
            {blocks.map((b) => (b.kind === "text" ? b.content : "")).join("")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 mb-4">
      {/* Avatar dot */}
      <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-gradient-to-br from-gray-900 to-gray-600 flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1 max-w-[90%] lg:max-w-[80%]">
        {blocks.map((block, i) => {
          if (block.kind === "text" && block.content.trim()) {
            return (
              <p key={i} className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap mb-1">
                {block.content}
              </p>
            );
          }
          if (block.kind === "outfit") {
            return <OutfitCard key={i} outfit={block} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parse stored content
// ---------------------------------------------------------------------------
function parseStoredContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let remaining = content;
  while (remaining.length > 0) {
    const outfitStart = remaining.indexOf("<outfit ");
    if (outfitStart === -1) {
      if (remaining.trim()) blocks.push({ kind: "text", content: remaining });
      break;
    }
    const textBefore = remaining.slice(0, outfitStart);
    if (textBefore.trim()) blocks.push({ kind: "text", content: textBefore });
    const outfitEnd = remaining.indexOf("</outfit>", outfitStart);
    if (outfitEnd === -1) { blocks.push({ kind: "text", content: remaining.slice(outfitStart) }); break; }
    const outfitXml = remaining.slice(outfitStart, outfitEnd + "</outfit>".length);
    const nameMatch = outfitXml.match(/name="([^"]*)"/);
    const occasionMatch = outfitXml.match(/occasion="([^"]*)"/);
    const products: OutfitProduct[] = [];
    const productTagRegex = /<product\s+([^>]*?)\/>/g;
    let match;
    const getAttr = (attrs: string, name: string): string => {
      const re = new RegExp(`${name}="([^"]*)"`);
      const m = attrs.match(re);
      if (m) return m[1].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      return "";
    };
    while ((match = productTagRegex.exec(outfitXml)) !== null) {
      const attrs = match[1];
      products.push({
        slot: getAttr(attrs, "slot"), productId: getAttr(attrs, "productId"),
        name: getAttr(attrs, "name"), productImageUrl: getAttr(attrs, "imageUrl"),
        price: getAttr(attrs, "price") ? parseFloat(getAttr(attrs, "price")) || null : null,
        brand: getAttr(attrs, "brand"), url: "",
      });
    }
    blocks.push({
      kind: "outfit",
      name: getAttr(outfitXml.split(">")[0] + ">", "name") || nameMatch?.[1] || "Your Outfit",
      occasion: getAttr(outfitXml.split(">")[0] + ">", "occasion") || occasionMatch?.[1] || "",
      products,
    });
    remaining = remaining.slice(outfitEnd + "</outfit>".length);
  }
  return blocks.length > 0 ? blocks : [{ kind: "text", content }];
}

// ---------------------------------------------------------------------------
// Desktop sidebar
// ---------------------------------------------------------------------------
function ChatSidebar({
  sessions, activeSessionId, isLoading, onSelect, onNew, onDelete,
}: {
  sessions: ChatSession[]; activeSessionId: string | null; isLoading: boolean;
  onSelect: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="hidden lg:flex flex-col w-64 border-r border-gray-100 bg-white h-full">
      <div className="px-5 py-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">FashionKilla</p>
          <h2 className="text-sm text-gray-900" style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>Style Buddy</h2>
        </div>
        <button
          onClick={onNew}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 pb-3">
        <div className="h-px bg-gray-100" />
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
          </div>
        )}
        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-gray-400">No conversations yet</p>
          </div>
        )}
        {sessions.map((s) => (
          <div
            key={s.sessionId}
            className={`group flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-xl cursor-pointer transition-all duration-150 ${
              s.sessionId === activeSessionId ? "bg-gray-950 text-white" : "hover:bg-gray-50"
            }`}
          >
            <button onClick={() => onSelect(s.sessionId)} className="flex-1 text-left min-w-0">
              <p className={`text-[12px] truncate leading-snug ${s.sessionId === activeSessionId ? "text-white" : "text-gray-800"}`} style={{ fontWeight: 420 }}>
                {s.title || "New conversation"}
              </p>
              <p className={`text-[10px] mt-0.5 ${s.sessionId === activeSessionId ? "text-white/50" : "text-gray-400"}`}>
                {new Date(s.updated_at ?? s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s.sessionId); }}
              className={`p-1 transition-all opacity-0 group-hover:opacity-100 ${s.sessionId === activeSessionId ? "text-white/50 hover:text-white" : "text-gray-300 hover:text-red-500"}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatPage
// ---------------------------------------------------------------------------
export function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showMobileSessions, setShowMobileSessions] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; blocks: ContentBlock[] }[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const streamingBlocksRef = useRef<ContentBlock[]>([]);
  const currentOutfitRef = useRef<OutfitBlock | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    setIsLoadingSessions(true);
    try {
      const s = await listChatSessions();
      setSessions(s);
      if (s.length > 0) await loadSession(s[0].sessionId);
    } catch (e) { console.error(e); } finally { setIsLoadingSessions(false); }
  }

  async function loadSession(sessionId: string) {
    try {
      const { messages: msgs } = await getChatSession(sessionId);
      setActiveSessionId(sessionId);
      setMessages(msgs.map((m) => ({
        role: m.role as "user" | "assistant",
        blocks: m.role === "user" ? [{ kind: "text" as const, content: m.content }] : parseStoredContent(m.content),
      })));
      setShowMobileSessions(false);
    } catch (e) { console.error(e); }
  }

  async function handleNewSession() {
    try {
      const session = await createChatSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.sessionId);
      setMessages([]);
      setShowMobileSessions(false);
      inputRef.current?.focus();
    } catch (e) { console.error(e); }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (activeSessionId === sessionId) { setActiveSessionId(null); setMessages([]); }
    } catch (e) { console.error(e); }
  }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const session = await createChatSession();
        setSessions((prev) => [session, ...prev]);
        sessionId = session.sessionId;
        setActiveSessionId(sessionId);
      } catch (e) { console.error(e); return; }
    }
    setMessages((prev) => [...prev, { role: "user", blocks: [{ kind: "text", content: text }] }]);
    setInput("");
    setIsStreaming(true);
    streamingBlocksRef.current = [];
    currentOutfitRef.current = null;
    setMessages((prev) => [...prev, { role: "assistant", blocks: [] }]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await sendChatMessage(sessionId, text, (chunk: ChatChunk) => {
        switch (chunk.type) {
          case "text": {
            const blocks = streamingBlocksRef.current;
            const last = blocks[blocks.length - 1];
            if (last && last.kind === "text") last.content += chunk.content ?? "";
            else blocks.push({ kind: "text", content: chunk.content ?? "" });
            break;
          }
          case "outfit_start":
            currentOutfitRef.current = { kind: "outfit", name: chunk.name ?? "Your Outfit", occasion: chunk.occasion ?? "", products: [] };
            break;
          case "product":
            if (currentOutfitRef.current) {
              currentOutfitRef.current.products.push({
                productId: chunk.productId ?? "", slot: chunk.slot ?? "", name: chunk.name ?? "",
                productImageUrl: chunk.productImageUrl ?? "", price: chunk.price ?? null, brand: chunk.brand ?? "", url: chunk.url ?? "",
              });
            }
            break;
          case "outfit_end":
            if (currentOutfitRef.current) { streamingBlocksRef.current.push(currentOutfitRef.current); currentOutfitRef.current = null; }
            break;
          case "error":
            streamingBlocksRef.current.push({ kind: "text", content: chunk.content ?? "Something went wrong." });
            break;
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", blocks: [...streamingBlocksRef.current] };
          return updated;
        });
      }, controller.signal);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", blocks: [{ kind: "text", content: "Something went wrong. Please try again." }] };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      if (sessionId) { try { const s = await listChatSessions(); setSessions(s); } catch {} }
    }
  }, [input, isStreaming, activeSessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);

  const SUGGESTIONS = [
    "Rave fit for DGTL festival",
    "Office look for Monday",
    "Casual brunch outfit",
    "Mehendi ceremony look",
  ];

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
      <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-2">FashionKilla AI</p>
      <h2 className="text-2xl text-gray-900 mb-2 leading-tight" style={{ letterSpacing: "-0.02em", fontWeight: 340 }}>
        Your personal<br />style buddy
      </h2>
      <p className="text-sm text-gray-400 max-w-[260px] mb-8 leading-relaxed">
        Tell me your vibe, occasion, or mood — I&apos;ll build a look from India&apos;s best indie brands.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setInput(s); inputRef.current?.focus(); }}
            className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-left hover:border-gray-300 hover:bg-white transition-all duration-200 group"
          >
            <span className="text-[12px] leading-snug text-gray-700 group-hover:text-gray-900 transition-colors">{s}</span>
            <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      <DesktopNav />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop sidebar */}
        <ChatSidebar
          sessions={sessions} activeSessionId={activeSessionId} isLoading={isLoadingSessions}
          onSelect={loadSession} onNew={handleNewSession} onDelete={handleDeleteSession}
        />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col relative min-w-0">

          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setShowMobileSessions(!showMobileSessions)}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[13px] text-gray-900 truncate" style={{ fontWeight: 480, letterSpacing: "-0.01em" }}>
                {activeSession?.title || "Style Buddy"}
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em]">FashionKilla AI</p>
            </div>
            <button
              onClick={handleNewSession}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile sessions drawer */}
          {showMobileSessions && (
            <div className="lg:hidden absolute inset-0 top-[57px] z-20 bg-white flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm text-gray-900" style={{ fontWeight: 500 }}>Conversations</h2>
                <button onClick={() => setShowMobileSessions(false)} className="text-[11px] text-gray-400 hover:text-gray-900 uppercase tracking-[0.1em]">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pt-2">
                <button
                  onClick={handleNewSession}
                  className="w-full px-3 py-3 mb-1 text-left text-sm text-gray-900 rounded-xl hover:bg-gray-50 border border-dashed border-gray-200 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                  New conversation
                </button>
                {sessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className={`flex items-center gap-2 px-3 py-3 mb-0.5 rounded-xl hover:bg-gray-50 transition-colors ${s.sessionId === activeSessionId ? "bg-gray-50" : ""}`}
                  >
                    <button onClick={() => loadSession(s.sessionId)} className="flex-1 text-left min-w-0">
                      <p className="text-[13px] text-gray-900 truncate" style={{ fontWeight: 420 }}>{s.title || "Untitled"}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(s.updated_at ?? s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.sessionId); }}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && !isLoadingSessions && (
                  <p className="text-center text-xs text-gray-400 py-8">No conversations yet</p>
                )}
              </div>
            </div>
          )}

          {/* Messages area — only this scrolls */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6 max-w-2xl w-full mx-auto">
            {messages.length === 0 && !isLoadingSessions && <EmptyState />}
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} blocks={msg.blocks} />
            ))}

            {/* Streaming typing indicator */}
            {isStreaming && messages.length > 0 && messages[messages.length - 1].blocks.length === 0 && (
              <div className="flex items-start gap-2.5 mb-4">
                <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-gradient-to-br from-gray-900 to-gray-600 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="flex gap-1 pt-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area — pinned to bottom of flex column, never scrolls away */}
          <div className="flex-shrink-0 pb-16 md:pb-4 lg:pb-4 px-4 pt-2 bg-white border-t border-gray-100/60">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.07)] focus-within:border-gray-400 transition-colors duration-200">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's your vibe today?"
                  rows={1}
                  className="flex-1 resize-none text-[13px] text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none max-h-32 leading-relaxed"
                  style={{ minHeight: "22px", maxHeight: "128px" }}
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 128) + "px";
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-25 hover:bg-gray-800 active:scale-95 transition-all duration-150"
                >
                  {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-300 mt-2 tracking-wide">
                Powered by FashionKilla AI · India&apos;s best indie brands
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
