'use client';

/**
 * Outfit Review — human-in-the-loop rating page.
 *
 * UX:
 *   - One outfit at a time, full visual: hero image + SKU grid + meta
 *   - 1-5 star rating (clickable or 1-5 keyboard)
 *   - Category radios (why this rating?)
 *   - Notes textarea (optional)
 *   - "Submit & Next" advances; the next un-rated-by-me outfit loads
 *
 * Keyboard:
 *   1 / 2 / 3 / 4 / 5  → set rating
 *   Enter              → submit (if rating set)
 *   n                  → skip (loads next without saving)
 *
 * The page redirects back to /admin if the user isn't whitelisted.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkAdminAccess,
  fetchOutfitToReview,
  fetchOutfitRatingStats,
  rateOutfit,
  type OutfitReviewItem,
  type OutfitRatingStats,
  type OutfitRatingCategory,
  type OutfitQualityFlag,
} from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Star,
  CheckCircle2,
  SkipForward,
  AlertCircle,
} from 'lucide-react';

const CATEGORY_OPTIONS: { value: OutfitRatingCategory; label: string }[] = [
  { value: 'hero', label: 'Hero — boost' },
  { value: 'good', label: 'Good' },
  { value: 'off_vibe', label: 'Off-vibe' },
  { value: 'bad_coherence', label: "Pieces don't go" },
  { value: 'low_quality', label: 'Low quality piece/image' },
  { value: 'unsure', label: 'Unsure' },
];

/**
 * Short human-readable labels for the anomaly detector's flags. Shown
 * inside the yellow QualityFlagBanner at the top of the review card so
 * the admin knows WHY the system pulled this outfit forward.
 */
const QUALITY_FLAG_LABELS: Record<OutfitQualityFlag, string> = {
  VIBE_MISMATCH_FOOTWEAR: 'Footwear vibe clashes with cluster',
  MISSING_BOTTOM_BODYSUIT: 'Bodysuit anchor missing a bottom',
  MISSING_FOOTWEAR: 'No footwear in outfit',
  THIN_OUTFIT: 'Outfit has fewer than 2 pieces',
  PRICE_TOO_LOW_FOR_CLUSTER: 'Total price under cluster floor',
  PRICE_TOO_HIGH_FOR_CLUSTER: 'Total price over cluster ceiling',
  PRICE_MISSING: 'Constituent SKUs missing price data',
};

function QualityFlagBanner({ flags }: { flags: OutfitQualityFlag[] }) {
  if (!flags.length) return null;
  return (
    <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs">
      <div className="mb-1 flex items-center gap-1.5 font-medium uppercase tracking-wider text-yellow-800">
        <AlertCircle className="h-3.5 w-3.5" />
        Detector flags · {flags.length}
      </div>
      <ul className="ml-1 space-y-0.5 text-yellow-900">
        {flags.map((f) => (
          <li key={f}>· {QUALITY_FLAG_LABELS[f] ?? f}</li>
        ))}
      </ul>
    </div>
  );
}

export default function OutfitReviewPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [outfit, setOutfit] = useState<OutfitReviewItem | null>(null);
  const [pendingTotal, setPendingTotal] = useState<number>(0);
  const [pendingFlagged, setPendingFlagged] = useState<number>(0);
  const [stats, setStats] = useState<OutfitRatingStats | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState<OutfitRatingCategory | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  // Auth check
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

  const loadNext = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setRating(0);
    setCategory('');
    setNotes('');
    setDoneMessage(null);
    try {
      const [r, s] = await Promise.all([
        fetchOutfitToReview(user.email),
        fetchOutfitRatingStats(user.email),
      ]);
      setOutfit(r.outfit);
      setPendingTotal(r.pending_total);
      setPendingFlagged(r.pending_flagged ?? 0);
      setStats(s);
      if (!r.outfit) setDoneMessage(r.message || 'No outfits left to review.');
      // Pre-fill if I've rated this before
      if (r.outfit?.my_rating) {
        setRating(r.outfit.my_rating.rating);
        setCategory((r.outfit.my_rating.category as OutfitRatingCategory) || '');
        setNotes(r.outfit.my_rating.notes || '');
      }
    } catch (e) {
      console.error('Failed to load outfit', e);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (authorized) loadNext();
  }, [authorized, loadNext]);

  const handleSubmit = useCallback(async () => {
    if (!outfit || !user?.email || !rating || submitting) return;
    setSubmitting(true);
    try {
      await rateOutfit(outfit.outfit_id, user.email, rating, category || '', notes);
      // Refresh stats + advance to next
      await loadNext();
    } catch (e) {
      console.error('Failed to submit rating', e);
      alert('Failed to submit rating. Try again?');
    } finally {
      setSubmitting(false);
    }
  }, [outfit, user?.email, rating, category, notes, submitting, loadNext]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!outfit) return;
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in notes
      if (document.activeElement === notesRef.current) return;
      if (e.key >= '1' && e.key <= '5') {
        setRating(parseInt(e.key, 10));
        e.preventDefault();
      } else if (e.key === 'Enter' && rating > 0 && !submitting) {
        handleSubmit();
        e.preventDefault();
      } else if (e.key === 'n' || e.key === 'N') {
        loadNext();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [outfit, rating, submitting, handleSubmit, loadNext]);

  // ── Render ────────────────────────────────────────────────────────────
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
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Outfit Review</h1>
              <p className="text-sm text-gray-500">
                Human-in-the-loop rating
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">
              {stats?.my_rated ?? 0} rated · {pendingTotal} pending
              {pendingFlagged > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-yellow-800">
                  <AlertCircle className="h-3 w-3" />
                  {pendingFlagged} flagged
                </span>
              )}
            </div>
            {stats?.avg_rating != null && (
              <div className="text-gray-500">avg {stats.avg_rating}★</div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && doneMessage && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold">{doneMessage}</h2>
              <Link href="/admin">
                <Button variant="outline">Back to dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!loading && outfit && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
            {/* Outfit visual — 3 cols */}
            <div className="md:col-span-3">
              <Card>
                <CardContent className="p-4">
                  {/* Hero image */}
                  <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-md bg-gray-100">
                    {outfit.hero_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={outfit.hero_image}
                        alt={outfit.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* SKU grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {outfit.skus.map((sku) => (
                      <div key={sku.product_id} className="text-xs">
                        <div className="relative aspect-square overflow-hidden rounded bg-gray-100">
                          {sku.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sku.image_url}
                              alt={sku.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              ?
                            </div>
                          )}
                          {sku.slot && (
                            <span className="absolute top-1 left-1 rounded bg-white/90 px-1 py-0.5 text-[9px] uppercase tracking-wider">
                              {sku.slot}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 line-clamp-2 text-gray-700">
                          {sku.name}
                        </div>
                        {sku.price_inr > 0 && (
                          <div className="text-gray-500">
                            ₹{sku.price_inr.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rating panel — 2 cols */}
            <div className="md:col-span-2">
              <Card>
                <CardContent className="space-y-4 p-4">
                  {/* Detector flags — top of the panel per user request */}
                  <QualityFlagBanner flags={outfit.quality_flags ?? []} />

                  {/* Outfit meta */}
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">
                      {outfit.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {outfit.cluster && (
                        <Badge variant="outline">{outfit.cluster}</Badge>
                      )}
                      {outfit.coherence_score != null && (
                        <span>coh {outfit.coherence_score.toFixed(2)}</span>
                      )}
                      <span>· {outfit.n_items} pieces</span>
                      {outfit.generated_by && outfit.generated_by !== 'default' && (
                        <Badge variant="secondary">{outfit.generated_by}</Badge>
                      )}
                    </div>
                    {(outfit.tags as Record<string, unknown>)?.story != null && (
                      <p className="mt-2 text-sm italic text-gray-600">
                        {String((outfit.tags as Record<string, unknown>).story)}
                      </p>
                    )}
                  </div>

                  <hr />

                  {/* Star rating */}
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wider text-gray-500">
                      Rating
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
                            n <= rating
                              ? 'bg-yellow-400 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={`${n} star${n > 1 ? 's' : ''} (press ${n})`}
                        >
                          <Star className="h-5 w-5" fill={n <= rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category radios */}
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wider text-gray-500">
                      Why?
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORY_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategory(category === c.value ? '' : c.value)}
                          className={`rounded px-2 py-1.5 text-left text-xs transition-colors ${
                            category === c.value
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wider text-gray-500">
                      Notes (optional)
                    </div>
                    <textarea
                      ref={notesRef}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any specific observations…"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!rating || submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {outfit.my_rating ? 'Update' : 'Submit'} & Next ↵
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={loadNext} disabled={submitting}>
                      <SkipForward className="mr-1 h-4 w-4" /> Skip (n)
                    </Button>
                  </div>

                  <p className="text-xs text-gray-400">
                    Shortcuts: 1-5 to rate · Enter to submit · n to skip
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
