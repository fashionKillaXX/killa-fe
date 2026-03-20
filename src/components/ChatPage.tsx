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
  ExternalLink,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import {
  ChatSession,
  ChatMessage as ChatMessageType,
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
// Types for parsed streaming content
// ---------------------------------------------------------------------------
interface TextBlock {
  kind: "text";
  content: string;
}

interface OutfitProduct {
  productId: string;
  slot: string;
  name: string;
  productImageUrl: string;
  price: number | null;
  brand: string;
  url: string;
}

interface OutfitBlock {
  kind: "outfit";
  name: string;
  occasion: string;
  products: OutfitProduct[];
}

type ContentBlock = TextBlock | OutfitBlock;

// ---------------------------------------------------------------------------
// Outfit Card component
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
        products: outfit.products.map((p) => ({
          productId: p.productId,
          slot: p.slot,
        })),
      });
      setIsSaved(true);
      toast.success("Outfit saved to your collection");
    } catch (e) {
      console.error("Failed to save outfit:", e);
      toast.error("Failed to save outfit");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="my-3 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {/* Header with action buttons */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {outfit.name}
            </h3>
            {outfit.occasion && (
              <p className="text-xs text-gray-500 mt-0.5">{outfit.occasion}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Save Outfit button */}
            <button
              onClick={handleSaveOutfit}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSaved
                  ? "bg-gray-100 text-gray-900"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Products */}
        <div className="divide-y divide-gray-100">
          {outfit.products.map((p) => (
            <div
              key={p.productId}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              {/* Image — tap to navigate */}
              <button
                onClick={() => router.push(`/products/${p.productId}`)}
                className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-gray-100"
              >
                {p.productImageUrl ? (
                  <img
                    src={p.productImageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
              </button>

              {/* Details */}
              <button
                onClick={() => router.push(`/products/${p.productId}`)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {p.slot}
                </p>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {p.name}
                </p>
                <p className="text-xs text-gray-500">{p.brand}</p>
                {p.price != null && (
                  <p className="text-xs font-semibold mt-0.5">
                    Rs. {Number(p.price).toLocaleString("en-IN")}
                  </p>
                )}
              </button>

              {/* Individual save */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSaveProduct(p);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-black flex-shrink-0"
                title="Save to collection"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save individual product to collection */}
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
// Single message bubble
// ---------------------------------------------------------------------------
function ChatBubble({
  role,
  blocks,
}: {
  role: "user" | "assistant";
  blocks: ContentBlock[];
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] bg-black text-white rounded-2xl rounded-br-md px-4 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {blocks
              .map((b) => (b.kind === "text" ? b.content : ""))
              .join("")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[95%] lg:max-w-[90%]">
        {blocks.map((block, i) => {
          if (block.kind === "text" && block.content.trim()) {
            return (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 mb-1"
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
                  {block.content}
                </p>
              </div>
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
// Helper: parse saved assistant content back into ContentBlocks
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
    if (outfitEnd === -1) {
      blocks.push({ kind: "text", content: remaining.slice(outfitStart) });
      break;
    }

    const outfitXml = remaining.slice(
      outfitStart,
      outfitEnd + "</outfit>".length
    );

    const nameMatch = outfitXml.match(/name="([^"]*)"/);
    const occasionMatch = outfitXml.match(/occasion="([^"]*)"/);

    const products: OutfitProduct[] = [];
    const productTagRegex = /<product\s+([^>]*?)\/>/g;
    let match;

    const getAttr = (attrs: string, name: string): string => {
      const re = new RegExp(`${name}="([^"]*)"`);
      const m = attrs.match(re);
      if (m)
        return m[1]
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
      return "";
    };

    while ((match = productTagRegex.exec(outfitXml)) !== null) {
      const attrs = match[1];
      products.push({
        slot: getAttr(attrs, "slot"),
        productId: getAttr(attrs, "productId"),
        name: getAttr(attrs, "name"),
        productImageUrl: getAttr(attrs, "imageUrl"),
        price: getAttr(attrs, "price")
          ? parseFloat(getAttr(attrs, "price")) || null
          : null,
        brand: getAttr(attrs, "brand"),
        url: "",
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
// Desktop Sidebar: Chat History
// ---------------------------------------------------------------------------
function ChatSidebar({
  sessions,
  activeSessionId,
  isLoading,
  onSelect,
  onNew,
  onDelete,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="hidden lg:flex flex-col w-72 border-r border-gray-100 bg-gray-50/50 h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-900" />
          <h2 className="text-sm font-semibold text-gray-900">
            Conversations
          </h2>
        </div>
        <button
          onClick={onNew}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          title="New conversation"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No conversations yet</p>
          </div>
        )}

        {sessions.map((s) => (
          <div
            key={s.sessionId}
            className={`group flex items-center gap-2 px-3 py-2.5 mx-2 my-0.5 rounded-lg cursor-pointer transition-colors ${
              s.sessionId === activeSessionId
                ? "bg-white shadow-sm border border-gray-200"
                : "hover:bg-white/60"
            }`}
          >
            <button
              onClick={() => onSelect(s.sessionId)}
              className="flex-1 text-left min-w-0"
            >
              <p className="text-[13px] text-gray-900 truncate">
                {s.title || "New conversation"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {new Date(s.updated_at ?? s.created_at).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short" }
                )}
              </p>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.sessionId);
              }}
              className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
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

  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showMobileSessions, setShowMobileSessions] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; blocks: ContentBlock[] }[]
  >([]);

  // Input & streaming state
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Streaming accumulator refs
  const streamingBlocksRef = useRef<ContentBlock[]>([]);
  const currentOutfitRef = useRef<OutfitBlock | null>(null);

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setIsLoadingSessions(true);
    try {
      const s = await listChatSessions();
      setSessions(s);
      if (s.length > 0) {
        await loadSession(s[0].sessionId);
      }
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  async function loadSession(sessionId: string) {
    try {
      const { messages: msgs } = await getChatSession(sessionId);
      setActiveSessionId(sessionId);
      setMessages(
        msgs.map((m) => ({
          role: m.role as "user" | "assistant",
          blocks:
            m.role === "user"
              ? [{ kind: "text" as const, content: m.content }]
              : parseStoredContent(m.content),
        }))
      );
      setShowMobileSessions(false);
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  }

  async function handleNewSession() {
    try {
      const session = await createChatSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.sessionId);
      setMessages([]);
      setShowMobileSessions(false);
      inputRef.current?.focus();
    } catch (e) {
      console.error("Failed to create session:", e);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  }

  // -----------------------------------------------------------------------
  // Send message + handle streaming
  // -----------------------------------------------------------------------
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
      } catch (e) {
        console.error("Failed to create session:", e);
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", blocks: [{ kind: "text", content: text }] },
    ]);
    setInput("");
    setIsStreaming(true);

    streamingBlocksRef.current = [];
    currentOutfitRef.current = null;

    setMessages((prev) => [...prev, { role: "assistant", blocks: [] }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await sendChatMessage(
        sessionId,
        text,
        (chunk: ChatChunk) => {
          switch (chunk.type) {
            case "text": {
              const blocks = streamingBlocksRef.current;
              const lastBlock = blocks[blocks.length - 1];
              if (lastBlock && lastBlock.kind === "text") {
                lastBlock.content += chunk.content ?? "";
              } else {
                blocks.push({
                  kind: "text",
                  content: chunk.content ?? "",
                });
              }
              break;
            }
            case "outfit_start": {
              currentOutfitRef.current = {
                kind: "outfit",
                name: chunk.name ?? "Your Outfit",
                occasion: chunk.occasion ?? "",
                products: [],
              };
              break;
            }
            case "product": {
              if (currentOutfitRef.current) {
                currentOutfitRef.current.products.push({
                  productId: chunk.productId ?? "",
                  slot: chunk.slot ?? "",
                  name: chunk.name ?? "",
                  productImageUrl: chunk.productImageUrl ?? "",
                  price: chunk.price ?? null,
                  brand: chunk.brand ?? "",
                  url: chunk.url ?? "",
                });
              }
              break;
            }
            case "outfit_end": {
              if (currentOutfitRef.current) {
                streamingBlocksRef.current.push(currentOutfitRef.current);
                currentOutfitRef.current = null;
              }
              break;
            }
            case "error": {
              streamingBlocksRef.current.push({
                kind: "text",
                content: chunk.content ?? "Something went wrong.",
              });
              break;
            }
            case "done":
              break;
          }

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              blocks: [...streamingBlocksRef.current],
            };
            return updated;
          });
        },
        controller.signal
      );
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Chat error:", e);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            blocks: [
              {
                kind: "text",
                content: "Something went wrong. Please try again.",
              },
            ],
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      if (sessionId) {
        try {
          const s = await listChatSessions();
          setSessions(s);
        } catch {
          /* ignore */
        }
      }
    }
  }, [input, isStreaming, activeSessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const activeSession = sessions.find(
    (s) => s.sessionId === activeSessionId
  );

  // Empty state (no messages)
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Style Buddy</h2>
      <p className="text-sm text-gray-500 max-w-[280px] mb-6">
        Ask me for outfit ideas, styling tips, or help finding the perfect piece
        from indie Indian brands.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {[
          "Rave fit for DGTL festival",
          "Office look for Monday",
          "Casual brunch outfit",
          "Mehendi ceremony look",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setInput(suggestion);
              inputRef.current?.focus();
            }}
            className="text-xs px-3 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DesktopNav />

      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        {/* Desktop sidebar */}
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          onSelect={loadSession}
          onNew={handleNewSession}
          onDelete={handleDeleteSession}
        />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Mobile top bar (hidden on desktop) */}
          <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setShowMobileSessions(!showMobileSessions)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {activeSession?.title || "Style Buddy"}
              </h1>
              <p className="text-[11px] text-gray-400">
                Your AI fashion friend
              </p>
            </div>
            <button
              onClick={handleNewSession}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Mobile sessions drawer */}
          {showMobileSessions && (
            <div className="lg:hidden absolute inset-0 top-[57px] z-20 bg-white flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Conversations
                </h2>
                <button
                  onClick={() => setShowMobileSessions(false)}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <button
                  onClick={handleNewSession}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-black hover:bg-gray-50 border-b border-gray-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New conversation
                </button>
                {sessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className={`flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                      s.sessionId === activeSessionId ? "bg-gray-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => loadSession(s.sessionId)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm text-gray-900 truncate">
                        {s.title || "Untitled"}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(
                          s.updated_at ?? s.created_at
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(s.sessionId);
                      }}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && !isLoadingSessions && (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No conversations yet
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 lg:pb-24">
            {messages.length === 0 && !isLoadingSessions && <EmptyState />}

            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} blocks={msg.blocks} />
            ))}

            {/* Streaming indicator */}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].blocks.length === 0 && (
                <div className="flex justify-start mb-3">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 md:pb-3 pb-20">
            <div className="max-w-2xl mx-auto flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about outfits, style tips..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 max-h-32 bg-gray-50"
                style={{
                  height: "auto",
                  minHeight: "40px",
                  maxHeight: "128px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 128) + "px";
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-30 transition-opacity"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
