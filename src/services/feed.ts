/**
 * Phase 1 brain feed service. Wraps the Django endpoints under
 * /fashion/api/feed/. Anonymous-friendly — uses X-Brain-Session header
 * (UUID stored in localStorage) when no auth token is present.
 */
import api from "@/services/api";

const SESSION_KEY = "fitcurry_brain_session_v1";

export function getBrainSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setBrainSessionId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, id);
}

export function clearBrainSessionId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

function brainHeaders(): Record<string, string> {
  const sid = getBrainSessionId();
  return sid ? { "X-Brain-Session": sid } : {};
}

// ---- Types (mirror feed_views.py shapes) ----

export interface PreviewSku {
  product_id: string;
  title: string;
  garment?: string | null;
  color?: string[];
  price_inr: number;
  image_url?: string | null;
  slot?: string | null;
}

export interface OutfitCard {
  outfit_id: string;
  title: string;
  description?: string;
  story?: string;
  aesthetic: string[];
  occasion: string[];
  total_price_inr: number;
  n_items: number;
  cluster: string;
  cluster_label?: string;
  trend_velocity: number;
  is_exploration: boolean;
  is_saved?: boolean;
  image_url?: string | null;
  constituent_sku_previews: PreviewSku[];
}

export interface FeedMetadata {
  active_strategy: string;
  user_confidence: number;
  exploration_share: number;
  archetype_mix: Record<string, number>;
}

export interface FeedResponse {
  success: boolean;
  cards: OutfitCard[];
  feed_metadata: FeedMetadata;
  next_cursor: string | null;
}

export interface OutfitDetail {
  outfit_id: string;
  title: string;
  description: string;
  aesthetic: string[];
  occasion: string[];
  color_family: string[];
  total_price_inr: number;
  cluster: string;
  trend_velocity: number;
  composition_source: string;
  constituent_skus: Array<{
    product_id: string;
    title: string;
    brand_id?: string | null;
    price_inr: number;
    image_url?: string | null;
    tag_fingerprint: any;
  }>;
  image_url?: string | null;
}

export interface ChatResponse {
  success: boolean;
  parsed_intent: {
    occasion?: string | null;
    price_max?: number | null;
    aesthetic: string[];
    garment_focus: string[];
    exclusions: string[];
    modesty: string[];
  };
  top_outfit: OutfitCard | null;
  suggested_anchor_id: string | null;
  feed: OutfitCard[];
  user_confidence_after: number;
  assistant_message: string;
}

export interface SavedResponse {
  success: boolean;
  saved_outfits: OutfitCard[];
  saved_skus: Array<{
    product_id: string;
    title: string;
    brand_id?: string | null;
    price_inr: number;
    image_url?: string | null;
  }>;
}

// ---- API methods ----

export interface SessionContext {
  demographic?: { age_band?: string; gender?: string };
  geo?: { city?: string; tier?: number; climate?: string };
  device_class?: string;
  campaign_creative_tags?: Record<string, string[]>;
  session_time?: { hour?: number; weekday?: number };
}

export async function startBrainSession(ctx: SessionContext): Promise<string> {
  const r = await api.post("/api/feed/session", ctx, { headers: brainHeaders() });
  const sid = r.data?.anon_session_id;
  if (sid) setBrainSessionId(sid);
  return sid;
}

export async function getFeed(opts: { k?: number; anchor_id?: string } = {}): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (opts.k) params.set("k", String(opts.k));
  if (opts.anchor_id) params.set("anchor_id", opts.anchor_id);
  const qs = params.toString();
  const r = await api.get(`/api/feed/${qs ? `?${qs}` : ""}`, { headers: brainHeaders() });
  return r.data;
}

export async function getOutfit(outfitId: string): Promise<OutfitDetail> {
  const r = await api.get(`/api/feed/outfits/${outfitId}/`, { headers: brainHeaders() });
  return r.data;
}

export async function emitBrainEvent(payload: {
  event_type:
    | "save_outfit"
    | "unsave_outfit"
    | "dismiss_outfit"
    | "save_sku"
    | "unsave_sku"
    | "dismiss_sku"
    | "expand"
    | "long_dwell"
    | "share";
  target_type: "outfit" | "sku";
  target_id: string;
  context?: Record<string, any>;
}): Promise<{ success: boolean; new_total_confidence: number; new_active_strategy: string }> {
  const r = await api.post("/api/feed/events", payload, { headers: brainHeaders() });
  return r.data;
}

export interface PageContext {
  focused_outfit_id?: string | null;
  visible_outfit_ids?: string[];
  current_view?: "feed" | "outfit_detail" | "anchor_mode" | null;
}

export async function chatWithStylist(payload: {
  message: string;
  page_context?: PageContext;
}): Promise<ChatResponse> {
  const r = await api.post("/api/feed/chat", payload, { headers: brainHeaders() });
  return r.data;
}

export async function getBrainSaved(): Promise<SavedResponse> {
  const r = await api.get("/api/feed/saved", { headers: brainHeaders() });
  return r.data;
}

export async function getBrainRefine(): Promise<{
  total_confidence: number;
  active_strategy: string;
  event_count: number;
  saved_outfits_count: number;
  owner: string;
}> {
  const r = await api.get("/api/feed/refine", { headers: brainHeaders() });
  return r.data;
}

/**
 * Backfill: when an anon user logs in, transfer their brain state to the new
 * user row so saved outfits / centroid / event count carry over.
 * Requires Bearer token (the now-logged-in user). No-op if no anon session.
 */
export async function upgradeBrainSession(anonSessionId: string): Promise<{
  success: boolean;
  upgraded: boolean;
  total_confidence?: number;
  active_strategy?: string;
  saved_outfits_count?: number;
}> {
  const r = await api.post(
    "/api/feed/upgrade-session",
    { anon_session_id: anonSessionId },
  );
  return r.data;
}
