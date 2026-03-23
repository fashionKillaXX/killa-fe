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
  | 'embedding_generation';

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
