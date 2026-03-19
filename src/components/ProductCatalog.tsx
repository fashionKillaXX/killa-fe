"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SaveToCollectionSheet } from "@/components/SaveToCollectionSheet";
import { BookmarkIcon } from "@/components/shared/BookmarkIcon";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { fetchProductsUnified, type Product as UnifiedProduct } from "@/services/products";
import { searchAI } from "@/services/search";

interface Product {
  id: string;
  name: string;
  price: number | null;
  image: string;
  bookmarked: boolean;
  savedCollectionIds: string[];  // Collection IDs this product is saved in
  count?: number;
  brand?: string;
  brandLogo?: string;
  brandInstagram?: string;
  description?: string;
  images?: string[];
}

export interface ActiveFilter {
  type: 'scene' | 'vibe' | 'collection' | 'userCollection' | 'search';
  value: string;
  label?: string;
}

interface ProductCatalogProps {
  /** Pass filter directly as a prop. If omitted, filter is read from URL search params. */
  activeFilter?: ActiveFilter | null;
  /** Hide the back-arrow header (useful when embedded in another page). */
  hideHeader?: boolean;
}

/**
 * Product catalog grid view.
 * Supports two modes:
 *  1. Standalone: reads filter from URL search params (type, value, label).
 *  2. Embedded: receives activeFilter as a prop (e.g. inside SearchPage).
 */
export function ProductCatalog({
  activeFilter: activeFilterProp,
  hideHeader = false,
}: ProductCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine the active filter: prefer prop, fall back to URL search params
  // URLs use direct param names: ?vibe=trendy, ?scene=casual, ?collection=X, ?userCollection=X, ?search=X
  const urlFilter: ActiveFilter | null = (() => {
    const label = searchParams.get("label") || undefined;
    if (searchParams.get("scene")) return { type: "scene" as const, value: searchParams.get("scene")!, label };
    if (searchParams.get("vibe")) return { type: "vibe" as const, value: searchParams.get("vibe")!, label };
    if (searchParams.get("collection")) return { type: "collection" as const, value: searchParams.get("collection")!, label };
    if (searchParams.get("userCollection")) return { type: "userCollection" as const, value: searchParams.get("userCollection")!, label };
    if (searchParams.get("search")) return { type: "search" as const, value: searchParams.get("search")!, label };
    return null;
  })();
  const activeFilter = activeFilterProp !== undefined ? activeFilterProp : urlFilter;

  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [productToSave, setProductToSave] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  const buildFilterParams = (filterOverride?: ActiveFilter | null): Record<string, string> => {
    const f = filterOverride ?? activeFilter;
    if (!f) return {};
    const map: Record<string, string> = {};
    if (f.type === 'scene') map.scene = f.value;
    else if (f.type === 'vibe') map.vibe = f.value;
    else if (f.type === 'collection') map.collection = f.value;
    else if (f.type === 'userCollection') map.userCollectionId = f.value;
    return map;
  };

  const mapProducts = (apiProducts: any[]): Product[] =>
    apiProducts.map(p => ({
      id: p.productId,
      name: p.name,
      price: p.price || null,
      image: p.productImageUrl,
      bookmarked: p.isSaved,
      savedCollectionIds: p.savedCollectionIds || [],
      brand: p.brand?.name,
      description: p.description || p.name,
      images: p.imageList,
    }));

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setOffset(0);
      try {
        if (activeFilter?.type === 'search') {
          const searchResponse = await searchAI(activeFilter.value, PAGE_SIZE, 0);
          if (searchResponse.success) {
            const searchProducts: Product[] = searchResponse.results.map(p => ({
              id: p.product_id,
              name: p.name,
              price: null,
              image: p.product_image_url,
              bookmarked: false,
              savedCollectionIds: [],
              brand: undefined,
              description: p.name,
              images: [p.product_image_url]
            }));
            setProducts(searchProducts);
            setTotal(searchResponse.total || searchProducts.length);
            setHasMore(searchResponse.hasMore ?? false);
            setOffset(PAGE_SIZE);
          } else {
            setProducts([]);
            setTotal(0);
            setHasMore(false);
          }
          setLoading(false);
          return;
        }

        const params = buildFilterParams();
        const response = await fetchProductsUnified({ ...params, limit: PAGE_SIZE, offset: 0 } as any);

        if (response && response.success) {
          setProducts(mapProducts(response.products));
          setTotal(response.total);
          setHasMore(response.hasMore);
          setOffset(PAGE_SIZE);
        } else {
          setProducts([]);
          setTotal(0);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter?.type, activeFilter?.value, activeFilter?.label]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      if (activeFilter?.type === 'search') {
        // Paginate AI search results
        const searchResponse = await searchAI(activeFilter.value, PAGE_SIZE, offset);
        if (searchResponse.success && searchResponse.results.length > 0) {
          const moreProducts: Product[] = searchResponse.results.map(p => ({
            id: p.product_id,
            name: p.name,
            price: null,
            image: p.product_image_url,
            bookmarked: false,
            savedCollectionIds: [],
            brand: undefined,
            description: p.name,
            images: [p.product_image_url]
          }));
          setProducts(prev => [...prev, ...moreProducts]);
          setHasMore(searchResponse.hasMore ?? false);
          setOffset(prev => prev + PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      } else {
        const params = buildFilterParams();
        const response = await fetchProductsUnified({ ...params, limit: PAGE_SIZE, offset } as any);
        if (response && response.success) {
          setProducts(prev => [...prev, ...mapProducts(response.products)]);
          setHasMore(response.hasMore);
          setOffset(prev => prev + PAGE_SIZE);
        }
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleBookmarkClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToSave(product);
    setSaveSheetOpen(true);
  };

  const handleBackClick = () => {
    // If viewing a user collection, go back to collections page
    if (activeFilter?.type === 'userCollection') {
      router.push('/collections');
    } else {
      router.push('/');
    }
  };

  const handleProductClick = (productId: string, initialImageUrl?: string) => {
    router.push('/products/' + productId);
  };

  const getPageTitle = () => {
    if (activeFilter) {
      // Use label if provided (for user collections), otherwise use value
      return activeFilter.label || activeFilter.value;
    }
    return "Products";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col max-w-md md:max-w-7xl mx-auto">
        {!hideHeader && <DesktopNav />}
        {!hideHeader && <SubpageHeader onBackClick={handleBackClick} />}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading products...</p>
        </div>
        {!hideHeader && <BottomNav />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md md:max-w-7xl mx-auto">
      {/* Desktop nav */}
      {!hideHeader && <DesktopNav />}
      {/* Mobile header */}
      {!hideHeader && (
        <SubpageHeader
          onBackClick={handleBackClick}
          showDivider={false}
        />
      )}

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-12 pb-24 md:pb-12 overflow-y-auto">
        {/* Page Title */}
        <div className="pb-4 md:pb-6 md:pt-4">
          <h1 className="uppercase tracking-wide text-xl">{getPageTitle()}</h1>
        </div>

        {/* Product count */}
        {!loading && total > 0 && (
          <p className="text-xs text-gray-400 mb-4 md:mb-6">{products.length} of {total} products</p>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col group">
                {/* Product Image */}
                <div
                  className="relative bg-[#E5E5E5] aspect-[3/4] overflow-hidden cursor-pointer active:opacity-90 transition-all duration-300 rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] md:group-hover:shadow-lg md:group-hover:scale-[1.02]"
                  onClick={() => handleProductClick(product.id, product.image)}
                >
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex items-start justify-between mt-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-gray-700 truncate">
                      {product.name}
                    </p>
                    {product.price != null && (
                      <p className="text-sm md:text-base mt-0.5">{"\u20B9"} {product.price.toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleBookmarkClick(product, e)}
                    className="p-1 -mr-1 flex-shrink-0 opacity-0 group-hover:opacity-100 md:transition-opacity duration-200"
                    style={{ opacity: product.bookmarked ? 1 : undefined }}
                  >
                    <BookmarkIcon isSaved={product.bookmarked} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center py-8 md:py-12">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="border border-black px-8 md:px-12 py-3 text-black text-sm tracking-wide hover:bg-black hover:text-white transition-all duration-300 uppercase disabled:opacity-50 rounded-[4px]"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {!hideHeader && <BottomNav />}

      {/* Save to Collection Sheet */}
      {productToSave && (
        <SaveToCollectionSheet
          open={saveSheetOpen}
          onOpenChange={setSaveSheetOpen}
          productId={productToSave.id}
          productName={productToSave.name}
          savedCollectionIds={productToSave.savedCollectionIds}
          onSaveSuccess={(updatedIds) => {
            // Update the product's savedCollectionIds in local state
            setProducts(prev => prev.map(p =>
              p.id === productToSave.id
                ? { ...p, savedCollectionIds: updatedIds, bookmarked: updatedIds.length > 0 }
                : p
            ));
          }}
        />
      )}
    </div>
  );
}
