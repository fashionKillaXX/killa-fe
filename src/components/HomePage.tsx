"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { Header } from "@/components/Header";
import { fetchTagPreviews, TagPreviewsResponse } from "@/services/api";

type CardItem = {
  value: string;
  image: string;
  productId?: string;
};

type ExploreCardConfig = {
  title: "Occasion" | "Vibe" | "Season" | "Fit";
  subtitle: string;
  queryKey: "scene" | "vibe" | "search";
  items: CardItem[];
  quickTags: string[];
  reverse?: boolean;
};

type TagPreviewCachePayload = {
  expiresAt: number;
  data: TagPreviewsResponse;
};

const TAG_PREVIEWS_CACHE_KEY = "fashionkilla:tag-previews:v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const EXPLORE_CARDS: ExploreCardConfig[] = [
  {
    title: "Occasion",
    subtitle: "Looks for every moment",
    queryKey: "scene",
    quickTags: ["casual", "party", "wedding"],
    items: [
      { value: "casual", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&auto=format&fit=crop" },
      { value: "everyday", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=80&auto=format&fit=crop" },
      { value: "work", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=900&q=80&auto=format&fit=crop" },
      { value: "party", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=80&auto=format&fit=crop" },
      { value: "streetwear", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&q=80&auto=format&fit=crop" },
      { value: "wedding", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80&auto=format&fit=crop" },
    ],
  },
  {
    title: "Vibe",
    subtitle: "Define your aesthetic",
    queryKey: "vibe",
    quickTags: ["minimalist", "luxury", "y2k"],
    reverse: true,
    items: [
      { value: "trendy", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&q=80&auto=format&fit=crop" },
      { value: "minimalist", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&q=80&auto=format&fit=crop" },
      { value: "classic", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&q=80&auto=format&fit=crop" },
      { value: "luxury", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80&auto=format&fit=crop" },
      { value: "boho", image: "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=900&q=80&auto=format&fit=crop" },
      { value: "y2k", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&q=80&auto=format&fit=crop" },
    ],
  },
  {
    title: "Season",
    subtitle: "Curated for the weather",
    queryKey: "search",
    quickTags: ["summer", "fall", "winter"],
    items: [
      { value: "spring", image: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=900&q=80&auto=format&fit=crop" },
      { value: "summer", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&q=80&auto=format&fit=crop" },
      { value: "fall", image: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=900&q=80&auto=format&fit=crop" },
      { value: "winter", image: "https://images.unsplash.com/photo-1483982258113-b72862e6cff6?w=900&q=80&auto=format&fit=crop" },
      { value: "all-season", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80&auto=format&fit=crop" },
    ],
  },
  {
    title: "Fit",
    subtitle: "Silhouette and structure",
    queryKey: "search",
    quickTags: ["oversized", "tailored", "baggy"],
    reverse: true,
    items: [
      { value: "oversized", image: "https://images.unsplash.com/photo-1514996937319-344454492b37?w=900&q=80&auto=format&fit=crop" },
      { value: "regular", image: "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8dd?w=900&q=80&auto=format&fit=crop" },
      { value: "tailored", image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=900&q=80&auto=format&fit=crop" },
      { value: "baggy", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80&auto=format&fit=crop" },
      { value: "cropped", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=80&auto=format&fit=crop" },
    ],
  },
];

function ExploreCard({
  card,
  onSelect,
  onProductClick,
  isLoading,
}: {
  card: ExploreCardConfig;
  onSelect: (queryKey: "scene" | "vibe" | "search", value: string) => void;
  onProductClick: (productId: string) => void;
  isLoading: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const hasItems = card.items.length > 0;
  const doubled = hasItems ? [...card.items, ...card.items] : [];

  useEffect(() => {
    if (!hasItems) return;
    const track = trackRef.current;
    if (!track) return;
    const speed = card.reverse ? -0.32 : 0.32;
    let pos = card.reverse ? -(track.scrollWidth / 2) : 0;

    const tick = () => {
      if (!pausedRef.current) {
        pos += speed;
        const half = track.scrollWidth / 2;
        if (pos >= half) pos -= half;
        if (pos < 0) pos += half;
        track.style.transform = `translateX(${-pos}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [card.reverse, hasItems]);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-gray-100/90 bg-black/[0.04] shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-[0_14px_38px_rgba(0,0,0,0.11)]"
      style={{ minHeight: 250 }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { pausedRef.current = false; }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {hasItems ? (
          <div ref={trackRef} className="flex h-full gap-2 will-change-transform" style={{ width: "max-content" }}>
            {doubled.map((item, i) => (
              <button
                key={(item.productId ?? item.value) + i}
                onClick={() => item.productId ? onProductClick(item.productId) : onSelect(card.queryKey, item.value)}
                className="group/item relative h-full flex-shrink-0 overflow-hidden rounded-[10px] transition-transform duration-500 ease-out hover:scale-[1.04] focus-visible:scale-[1.04] focus-visible:outline-none"
                style={{ width: 128 }}
              >
                <img
                  src={item.image}
                  alt={item.value}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/item:scale-[1.08]"
                />
                <span className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-500 ease-out group-hover/item:bg-white/[0.08]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-full gap-2 px-2 py-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-full w-32 flex-shrink-0 animate-pulse rounded-[10px] bg-white/20"
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out group-hover:opacity-95"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.24) 42%, rgba(0,0,0,0.1) 100%)" }}
      />

      <div className="absolute inset-x-0 top-0 p-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/75">{card.subtitle}</p>
        <h2 className="text-2xl text-white" style={{ letterSpacing: "-0.02em", fontWeight: 350 }}>
          {card.title}
        </h2>
      </div>

      {!isLoading && !hasItems && (
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/85">
            No products available right now
          </p>
        </div>
      )}
    </div>
  );
}

function mergeWithApiData(
  base: ExploreCardConfig[],
  data: TagPreviewsResponse
): ExploreCardConfig[] {
  const sectionMap: Record<string, keyof TagPreviewsResponse> = {
    Occasion: "occasion",
    Vibe: "vibe",
    Season: "season",
    Fit: "fit",
  };

  return base.map((card) => {
    const key = sectionMap[card.title];
    const apiItems = key ? data[key] : [];

    return {
      ...card,
      items: (apiItems ?? []).map((p) => ({
        value: p.name,
        image: p.productImageUrl,
        productId: p.productId,
      })),
    };
  });
}

function getEmptyTagPreviewData(): TagPreviewsResponse {
  return {
    occasion: [],
    vibe: [],
    fit: [],
    season: [],
  };
}

function readTagPreviewCache(): TagPreviewCachePayload | null {
  try {
    const raw = localStorage.getItem(TAG_PREVIEWS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TagPreviewCachePayload;
    if (!parsed?.data || typeof parsed.expiresAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeTagPreviewCache(data: TagPreviewsResponse): void {
  try {
    const payload: TagPreviewCachePayload = {
      data,
      expiresAt: Date.now() + ONE_DAY_MS,
    };
    localStorage.setItem(TAG_PREVIEWS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore cache write failures (private mode, quota, etc.)
  }
}

function hasImages(items: { productImageUrl: string }[]): boolean {
  return items.some((item) => Boolean(item.productImageUrl));
}

function hasAllSectionsWithImages(data: TagPreviewsResponse): boolean {
  return (
    hasImages(data.occasion) &&
    hasImages(data.vibe) &&
    hasImages(data.fit) &&
    hasImages(data.season)
  );
}

function mergeMissingSections(
  cached: TagPreviewsResponse,
  fresh: TagPreviewsResponse
): TagPreviewsResponse {
  return {
    occasion: hasImages(cached.occasion) ? cached.occasion : fresh.occasion,
    vibe: hasImages(cached.vibe) ? cached.vibe : fresh.vibe,
    fit: hasImages(cached.fit) ? cached.fit : fresh.fit,
    season: hasImages(cached.season) ? cached.season : fresh.season,
  };
}

export function HomePage() {
  const router = useRouter();
  const [cards, setCards] = useState<ExploreCardConfig[]>(
    EXPLORE_CARDS.map((card) => ({ ...card, items: [] }))
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTagPreviews = async () => {
      const cachedPayload = readTagPreviewCache();
      const hasValidCache =
        Boolean(cachedPayload) && (cachedPayload?.expiresAt ?? 0) > Date.now();

      if (hasValidCache && cachedPayload) {
        setCards(mergeWithApiData(EXPLORE_CARDS, cachedPayload.data));

        if (hasAllSectionsWithImages(cachedPayload.data)) {
          setIsLoading(false);
          return;
        }
      }

      try {
        const freshData = await fetchTagPreviews(20);
        const nextData =
          hasValidCache && cachedPayload
            ? mergeMissingSections(cachedPayload.data, freshData)
            : freshData;

        writeTagPreviewCache(nextData);
        if (!isMounted) return;
        setCards(mergeWithApiData(EXPLORE_CARDS, nextData));
      } catch {
        if (!isMounted) return;
        if (!hasValidCache) {
          setCards(mergeWithApiData(EXPLORE_CARDS, getEmptyTagPreviewData()));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTagPreviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelect = (queryKey: "scene" | "vibe" | "search", value: string) => {
    router.push(`/products?${queryKey}=${encodeURIComponent(value)}`);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md md:max-w-7xl mx-auto">
      <DesktopNav />
      <Header />

      <div className="flex-1 pb-24 md:pb-12 overflow-y-auto">
        <div className="px-6 pt-8 pb-5 md:pt-10">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">Curated Discover</p>
          <h1 className="text-3xl md:text-4xl leading-[0.95]" style={{ letterSpacing: "-0.03em", fontWeight: 320 }}>
            Find your look
          </h1>
          <p className="mt-2 text-sm text-gray-500">Pick a mood. Swipe through editorial aesthetics.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 md:px-6">
          {cards.map((card) => (
            <ExploreCard
              key={card.title}
              card={card}
              onSelect={handleSelect}
              onProductClick={handleProductClick}
              isLoading={isLoading}
            />
          ))}
        </div>

        <div className="px-5 pt-7 md:px-6">
          <button
            onClick={() => router.push("/products")}
            className="w-full rounded-md border border-gray-200 py-3 text-xs uppercase tracking-[0.18em] text-gray-700 transition-colors hover:border-black hover:text-black"
          >
            Browse all products
          </button>
        </div>
        <div className="h-7" />
      </div>

      <BottomNav />
    </div>
  );
}
