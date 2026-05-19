'use client';

/**
 * Outfit Library — admin browse + per-SKU download.
 *
 * Lists every default outfit with filters (cluster, has-price). Click any
 * card to open a side panel showing the outfit in two layouts:
 *   1. Editorial spread — magazine-style row of SKU images
 *   2. Pinterest tile — single hero with stacked detail
 * Each piece gets a Download button that hits Cloudinary's fl_attachment
 * flag so the browser saves the HD WebP locally instead of opening it.
 *
 * No carousel generation, no captions, no ZIPs — just browse-and-grab.
 */
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkAdminAccess,
  fetchOutfitLibrary,
  fetchOutfitLibraryDetail,
  type OutfitLibrarySummary,
  type OutfitLibraryDetail,
  type OutfitLibraryPiece,
} from '@/services/admin';
import { cdnImage } from '@/lib/imageUrl';
import { formatPriceINR } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';

const CLUSTER_OPTIONS = [
  { value: '', label: 'All clusters' },
  { value: 'cottagecore', label: 'Cottagecore' },
  { value: 'soft_girl', label: 'Coquette' },
  { value: 'coastal_grandmother', label: 'Tomato Girl' },
  { value: 'clean_girl', label: 'Clean Girl' },
  { value: 'quiet_luxury', label: 'Old Money' },
  { value: 'festival_boho', label: 'Boho' },
  { value: 'office_power', label: 'Power Dressing' },
  { value: 'y2k_revival', label: 'Y2K' },
  { value: 'streetwear', label: 'Streetwear' },
  { value: 'wedding_guest_india', label: 'Wedding Guest' },
  { value: 'athleisure', label: 'Athleisure' },
  { value: 'indo_fusion', label: 'Indo-Fusion' },
];

const PAGE_SIZE = 24;


export default function OutfitLibraryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // List state
  const [outfits, setOutfits] = useState<OutfitLibrarySummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cluster, setCluster] = useState('');
  const [hasPrice, setHasPrice] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detail panel state
  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OutfitLibraryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Auth gate (whitelist-based, like other admin pages) ───────────────
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user?.email) {
      setAuthorized(false);
      return;
    }
    checkAdminAccess(user.email)
      .then((ok) => setAuthorized(ok))
      .catch(() => setAuthorized(false));
  }, [user, isAuthenticated, authLoading]);

  // ── List load ─────────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetchOutfitLibrary({
        cluster: cluster || undefined,
        hasPrice: hasPrice || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setOutfits(resp.outfits);
      setTotalPages(resp.total_pages);
      setTotal(resp.total);
    } catch (e) {
      console.error('library load failed', e);
    } finally {
      setLoading(false);
    }
  }, [cluster, hasPrice, page]);

  useEffect(() => {
    if (authorized) loadList();
  }, [authorized, loadList]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [cluster, hasPrice]);

  // ── Detail load when an outfit is opened ──────────────────────────────
  useEffect(() => {
    if (!openOutfitId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetchOutfitLibraryDetail(openOutfitId)
      .then((d) => setDetail(d))
      .catch((e) => {
        console.error('detail load failed', e);
        setDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [openOutfitId]);

  // ── Gates ─────────────────────────────────────────────────────────────
  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!authorized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <Button variant="outline" onClick={() => router.push('/')}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Outfit Library</h1>
              <p className="text-sm text-gray-500">
                Browse + download SKUs for content
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            {total.toLocaleString('en-IN')} outfits
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={cluster}
            onChange={(e) => setCluster(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          >
            {CLUSTER_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={hasPrice}
              onChange={(e) => setHasPrice(e.target.checked)}
              className="rounded"
            />
            With prices only
          </label>
          <div className="ml-auto text-xs text-gray-500">
            page {page} of {Math.max(1, totalPages)}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {outfits.map((o) => (
              <OutfitTile
                key={o.outfit_id}
                outfit={o}
                onClick={() => setOpenOutfitId(o.outfit_id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>
            <span className="px-3 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </Button>
          </div>
        )}
      </main>

      {/* Detail drawer */}
      {openOutfitId && (
        <DetailDrawer
          loading={detailLoading}
          detail={detail}
          onClose={() => setOpenOutfitId(null)}
        />
      )}
    </div>
  );
}


// ── Tile: outfit summary card with a collage of its pieces ────────────────
//
// One hero image can't tell you what the outfit looks like ("Cottagecore tee"
// = same shot as 200 others). We render every piece in a collage so the
// reviewer can actually read the look at a glance. Adaptive grid by count:
//   1 piece  → full bleed
//   2 pieces → vertical split
//   3 pieces → 1 large + 2 stacked (magazine-y asymmetry)
//   4 pieces → 2×2 grid
//   5+       → 2×2 grid with a "+N" badge on the last cell
function OutfitTile({
  outfit,
  onClick,
}: {
  outfit: OutfitLibrarySummary;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-md border border-gray-200 bg-white text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
      <div className="relative aspect-square bg-gray-100">
        <OutfitCollage pieces={outfit.pieces_preview} />
        {outfit.quality_flags.length > 0 && (
          <span className="absolute right-2 top-2 z-10 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-yellow-800">
            ⚠ {outfit.quality_flags.length}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[10px]">
            {outfit.cluster.replace(/_/g, ' ')}
          </Badge>
          <span className="text-xs text-gray-500">
            {outfit.n_pieces} pieces · {formatPriceINR(outfit.total_price_inr)}
          </span>
        </div>
        <div className="mt-1.5 line-clamp-1 text-sm font-medium text-gray-900">
          {outfit.name}
        </div>
      </div>
    </button>
  );
}


function OutfitCollage({ pieces }: { pieces: OutfitLibrarySummary['pieces_preview'] }) {
  const usable = pieces.filter((p) => !!p.image_url);
  if (usable.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
        no images
      </div>
    );
  }
  const showCount = Math.min(usable.length, 4);
  const extra = Math.max(0, pieces.length - 4);

  const cell = (piece: OutfitLibrarySummary['pieces_preview'][number], sizes: string) => (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {piece.image_url && (
        <Image
          src={cdnImage(piece.image_url, { width: 600 })}
          alt={piece.slot || 'piece'}
          fill
          sizes={sizes}
          className="object-cover"
        />
      )}
      {piece.slot && (
        <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gray-700">
          {piece.slot}
        </span>
      )}
    </div>
  );

  // 1-piece — full bleed
  if (showCount === 1) {
    return <div className="absolute inset-0">{cell(usable[0], '50vw')}</div>;
  }

  // 2-piece — vertical split
  if (showCount === 2) {
    return (
      <div className="absolute inset-0 grid grid-cols-2 gap-px bg-gray-200">
        {cell(usable[0], '25vw')}
        {cell(usable[1], '25vw')}
      </div>
    );
  }

  // 3-piece — 1 large left + 2 stacked right (asymmetric, magazine-y)
  if (showCount === 3) {
    return (
      <div className="absolute inset-0 grid grid-cols-2 gap-px bg-gray-200">
        {cell(usable[0], '25vw')}
        <div className="grid grid-rows-2 gap-px bg-gray-200">
          {cell(usable[1], '25vw')}
          {cell(usable[2], '25vw')}
        </div>
      </div>
    );
  }

  // 4+ — 2×2 grid; if more than 4, last cell gets a +N badge
  const cells = usable.slice(0, 4);
  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-gray-200">
      {cells.map((p, i) => (
        <div key={i} className="relative">
          {cell(p, '25vw')}
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-2xl font-light text-white">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


// ── Detail drawer: 2 layouts + per-SKU download links ─────────────────────
function DetailDrawer({
  loading,
  detail,
  onClose,
}: {
  loading: boolean;
  detail: OutfitLibraryDetail | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-black/40"
      />
      <aside className="flex w-full max-w-3xl flex-col bg-white shadow-xl">
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              Outfit
            </span>
            <span className="text-base font-medium">
              {detail?.name ?? 'Loading…'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : detail ? (
            <DetailContent detail={detail} />
          ) : (
            <div className="p-6 text-sm text-gray-500">
              Failed to load outfit. Close and try again.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


function DetailContent({ detail }: { detail: OutfitLibraryDetail }) {
  const { pieces } = detail;
  return (
    <div className="space-y-8 px-5 py-6">
      {/* Story + meta */}
      <div className="text-sm text-gray-700">
        {detail.story && (
          <p className="italic text-gray-600">&ldquo;{detail.story}&rdquo;</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <Badge variant="outline">{detail.cluster.replace(/_/g, ' ')}</Badge>
          <span>{pieces.length} pieces</span>
          <span>total {formatPriceINR(detail.total_price_inr)}</span>
        </div>
      </div>

      {/* Layout 1: editorial row */}
      <section>
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gray-500">
          Layout 1 · Editorial row
        </h3>
        <div className="grid grid-cols-4 gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          {pieces.map((p) => (
            <div key={p.sku_id} className="relative aspect-[3/4] overflow-hidden rounded bg-white">
              {p.image_url ? (
                <Image
                  src={cdnImage(p.image_url, { width: 600 })}
                  alt={p.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  no img
                </div>
              )}
              {p.slot && (
                <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gray-700">
                  {p.slot}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Layout 2: vertical Pinterest stack */}
      <section>
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gray-500">
          Layout 2 · Vertical stack
        </h3>
        <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          {pieces.map((p) => (
            <div key={p.sku_id} className="flex gap-3 rounded bg-white p-2">
              <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                {p.image_url && (
                  <Image
                    src={cdnImage(p.image_url, { width: 200 })}
                    alt={p.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">
                  {p.slot} · {p.brand || 'indie'}
                </div>
                <div className="line-clamp-2 text-sm font-medium text-gray-900">
                  {p.name}
                </div>
                <div className="mt-0.5 text-xs text-gray-600">
                  {formatPriceINR(p.price_inr)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Per-SKU downloads */}
      <section>
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gray-500">
          Download SKU images
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          HD WebP via Cloudinary. Click to save the file locally — use it
          however you want in the post.
        </p>
        <div className="space-y-2">
          {pieces.map((p) => (
            <SkuDownloadRow key={p.sku_id} piece={p} />
          ))}
        </div>
      </section>
    </div>
  );
}


function SkuDownloadRow({ piece }: { piece: OutfitLibraryPiece }) {
  const downloadHref = piece.image_url
    ? cdnImage(piece.image_url, { width: 1600, download: true })
    : null;
  const sourceHref = piece.url || undefined;
  return (
    <div className="flex items-center gap-3 rounded border border-gray-200 bg-white p-2">
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-gray-100">
        {piece.image_url && (
          <Image
            src={cdnImage(piece.image_url, { width: 200 })}
            alt={piece.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">
          {piece.slot} · {piece.brand || 'indie'}
        </div>
        <div className="line-clamp-1 text-sm font-medium text-gray-900">
          {piece.name}
        </div>
        <div className="text-xs text-gray-600">
          {formatPriceINR(piece.price_inr)}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {sourceHref && (
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            title="View on brand site"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {downloadHref ? (
          <a
            href={downloadHref}
            className="inline-flex items-center gap-1 rounded bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        ) : (
          <span className="text-xs text-gray-400">no image</span>
        )}
      </div>
    </div>
  );
}
