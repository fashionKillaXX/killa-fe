/**
 * Admin Portal API Service
 * Talks to /admin/ endpoints on the backend.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ── Auth / Whitelist ──────────────────────────────────────────────────

export async function checkAdminAccess(email: string): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/api/admin/auth/check/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return data.allowed === true;
}

// ── Dashboard Stats ───────────────────────────────────────────────────

export interface DashboardStats {
  total_brands: number;
  total_products: number;
  products_with_tags: number;
  products_without_tags: number;
  products_with_images: number;
  products_with_embeddings: number;
  brands_with_skus: number;
  brands_enriched: number;
  user_metrics: {
    total_users: number;
    // Raw totals — surfaced on the admin dashboard
    total_saved_products: number;
    total_collections: number;
    total_searches: number;
    // Ratios kept for backward compat
    avg_saved_products: number;
    avg_collections: number;
    avg_items_per_collection: number;
    avg_searches: number;
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BACKEND_URL}/api/admin/dashboard/stats/`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.stats;
}

// ── Brands ────────────────────────────────────────────────────────────

export interface BrandPipeline {
  total_products: number;
  with_images: number;
  with_tags: number;
  with_embeddings: number;
}

export interface Brand {
  brandId: string;
  name: string;
  url: string | null;
  brandLogo: string | null;
  brandInstagram: string | null;
  product_count?: number;
  created_at: string;
  pipeline?: BrandPipeline;
}

export async function fetchBrands(): Promise<Brand[]> {
  const res = await fetch(`${BACKEND_URL}/api/admin/brands/`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.brands || [];
}

export async function createBrand(brand: {
  name: string;
  url?: string;
  brandInstagram?: string;
}): Promise<Brand> {
  const res = await fetch(`${BACKEND_URL}/api/admin/brands/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(brand),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create brand');
  return data.brand;
}

export async function deleteBrand(brandId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/admin/brands/`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ brandId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete brand');
}

// ── Jobs ──────────────────────────────────────────────────────────────

export type JobType =
  | 'scraping'
  | 'llm_analysis'
  | 'image_enrichment'
  | 'scraping_pipeline'
  | 'embedding_generation'
  | 'full_pipeline_all';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  jobId: string;
  job_type: JobType;
  status: JobStatus;
  parameters: Record<string, any>;
  logs: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  result_summary: Record<string, any>;
}

export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch(`${BACKEND_URL}/api/admin/jobs/`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.jobs || [];
}

export async function fetchJobDetail(jobId: string): Promise<Job> {
  const res = await fetch(`${BACKEND_URL}/api/admin/jobs/${jobId}/`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.job;
}

export async function createJob(
  jobType: JobType,
  parameters: Record<string, any> = {},
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/admin/jobs/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ job_type: jobType, parameters }),
  });
  const data = await res.json();
  if (!data.success && !data.jobId) throw new Error(data.error || 'Failed to create job');
  return data.jobId;
}

export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/admin/jobs/${jobId}/cancel/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success && !data.cancelled) throw new Error(data.error || 'Failed to cancel job');
}

// ── Outfit Review (human-in-the-loop rating) ──────────────────────────

export type OutfitRatingCategory =
  | 'hero'
  | 'good'
  | 'off_vibe'
  | 'bad_coherence'
  | 'low_quality'
  | 'unsure';

export interface OutfitReviewSku {
  product_id: string;
  name: string;
  slot: string;
  image_url: string | null;
  price_inr: number;
  brand: string | null;
}

/**
 * Quality flags the anomaly detector applies to an outfit.
 * Empty list = clean. The detector writes these into
 * Outfit.metadata.quality_flags and the BE lifts them to a top-level field.
 *
 * VIBE_MISMATCH_FOOTWEAR     footwear vibe conflicts with cluster blocklist
 * MISSING_BOTTOM_BODYSUIT    bodysuit/bralette anchor without a 'bottom'
 * MISSING_FOOTWEAR           outfit has no footwear slot
 * THIN_OUTFIT                fewer than 2 constituent SKUs
 * PRICE_TOO_LOW_FOR_CLUSTER  quiet_luxury/wedding outfit under price floor
 * PRICE_TOO_HIGH_FOR_CLUSTER cottagecore/clean_girl outfit over price ceiling
 * PRICE_MISSING              no extractable price data (data-quality flag)
 */
export type OutfitQualityFlag =
  | 'VIBE_MISMATCH_FOOTWEAR'
  | 'MISSING_BOTTOM_BODYSUIT'
  | 'MISSING_FOOTWEAR'
  | 'THIN_OUTFIT'
  | 'PRICE_TOO_LOW_FOR_CLUSTER'
  | 'PRICE_TOO_HIGH_FOR_CLUSTER'
  | 'PRICE_MISSING';

export interface OutfitReviewItem {
  outfit_id: string;
  name: string;
  description: string;
  tags: Record<string, unknown>;
  metadata: Record<string, unknown>;
  /** Anomaly flags surfaced by the detector. Empty array = clean. */
  quality_flags: OutfitQualityFlag[];
  quality_checked_at?: string | null;
  cluster: string;
  coherence_score: number | null;
  generated_by: string;
  hero_image: string | null;
  skus: OutfitReviewSku[];
  n_items: number;
  created_at: string | null;
  my_rating: {
    rating: number;
    category: string;
    notes: string;
    updated_at: string;
  } | null;
}

export interface OutfitReviewResponse {
  outfit: OutfitReviewItem | null;
  pending_total: number;
  /** Subset of pending_total — outfits the detector has flagged for review. */
  pending_flagged?: number;
  message?: string;
}

export interface OutfitRatingStats {
  total_outfits: number;
  total_rated_outfits: number;
  total_ratings: number;
  unrated_outfits: number;
  distribution: Record<string, number>;  // "1" → N, "2" → N, ... "5" → N
  avg_rating: number | null;
  my_pending: number | null;
  my_rated: number | null;
}

export async function fetchOutfitToReview(
  adminEmail: string,
  generatedBy: 'default' | 'chat' | 'any' = 'default',
): Promise<OutfitReviewResponse> {
  const params = new URLSearchParams({
    admin_email: adminEmail,
    generated_by: generatedBy,
  });
  const res = await fetch(`${BACKEND_URL}/api/admin/outfits/next/?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return {
    outfit: data.outfit,
    pending_total: data.pending_total,
    message: data.message,
  };
}

export async function rateOutfit(
  outfitId: string,
  adminEmail: string,
  rating: number,
  category: OutfitRatingCategory | '' = '',
  notes = '',
): Promise<{ created: boolean }> {
  const res = await fetch(`${BACKEND_URL}/api/admin/outfits/${outfitId}/rate/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ admin_email: adminEmail, rating, category, notes }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to rate outfit');
  return { created: !!data.created };
}

export async function fetchOutfitRatingStats(
  adminEmail?: string,
): Promise<OutfitRatingStats> {
  const params = new URLSearchParams();
  if (adminEmail) params.set('admin_email', adminEmail);
  const res = await fetch(
    `${BACKEND_URL}/api/admin/outfits/stats/?${params}`,
    { headers: authHeaders() },
  );
  const data = await res.json();
  return data.stats;
}


// ============================================================================
// Outfit library — browse + per-SKU direct download
// ============================================================================
// Lightweight types: the library never needs the full review payload, just
// enough to render a thumbnail card + drill into a detail panel where we
// re-render the outfit in a couple of layouts and link the user to per-SKU
// downloads served straight from Cloudinary.

export interface OutfitPiecePreview {
  slot: string | null;
  image_url: string | null;
}

export interface OutfitLibrarySummary {
  id: number;
  outfit_id: string;
  name: string;
  cluster: string;
  coherence_score: number | null;
  total_price_inr: number;
  n_pieces: number;
  /** First piece (top/dress/set) — kept for back-compat. */
  hero_image: string | null;
  /** Up to 5 piece thumbnails so the card can render the whole outfit as a
   *  collage. Empty array when the outfit has zero linked pieces. */
  pieces_preview: OutfitPiecePreview[];
  quality_flags: OutfitQualityFlag[];
}

export interface OutfitLibraryListResponse {
  outfits: OutfitLibrarySummary[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface OutfitLibraryPiece {
  sku_id: string;
  name: string;
  brand: string | null;
  slot: string | null;
  image_url: string | null;
  url: string | null;
  price_inr: number;
}

export interface OutfitLibraryDetail {
  outfit_id: string;
  name: string;
  cluster: string;
  total_price_inr: number;
  story: string;
  pieces: OutfitLibraryPiece[];
}

export async function fetchOutfitLibrary(opts: {
  cluster?: string;
  hasPrice?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<OutfitLibraryListResponse> {
  const params = new URLSearchParams();
  if (opts.cluster) params.set('cluster', opts.cluster);
  if (opts.hasPrice) params.set('has_price', '1');
  if (opts.page) params.set('page', String(opts.page));
  if (opts.pageSize) params.set('page_size', String(opts.pageSize));
  const res = await fetch(
    `${BACKEND_URL}/api/admin/outfits/library/?${params}`,
    { headers: authHeaders() },
  );
  const data = await res.json();
  return {
    outfits: data.outfits,
    page: data.page,
    page_size: data.page_size,
    total: data.total,
    total_pages: data.total_pages,
  };
}

export async function fetchOutfitLibraryDetail(
  outfitId: string,
): Promise<OutfitLibraryDetail> {
  const res = await fetch(
    `${BACKEND_URL}/api/admin/outfits/library/${outfitId}/`,
    { headers: authHeaders() },
  );
  const data = await res.json();
  return data.outfit;
}
