"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SaveToCollectionSheet } from "@/components/SaveToCollectionSheet";
import { BookmarkIcon } from "@/components/shared/BookmarkIcon";
import { BottomNav } from "@/components/BottomNav";
import { fetchProductsUnified, type Product as UnifiedProduct } from "@/services/products";
import { searchAI } from "@/services/search";

interface Product {
  id: string;
  name: string;
  price: number;
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
  const filterType = searchParams.get("type") as ActiveFilter["type"] | null;
  const filterValue = searchParams.get("value");
  const filterLabel = searchParams.get("label");
  const urlFilter: ActiveFilter | null = filterType && filterValue
    ? { type: filterType, value: filterValue, label: filterLabel || undefined }
    : null;
  const activeFilter = activeFilterProp !== undefined ? activeFilterProp : urlFilter;

  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [productToSave, setProductToSave] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      console.log('[ProductCatalog] Loading products with filter:', activeFilter);
      setLoading(true);
      try {
        let response;

        if (activeFilter) {
          // Use unified API with appropriate filter
          if (activeFilter.type === 'scene') {
            console.log('[ProductCatalog] Fetching scene products:', activeFilter.value);
            response = await fetchProductsUnified({ scene: activeFilter.value, limit: 20 });
          } else if (activeFilter.type === 'vibe') {
            console.log('[ProductCatalog] Fetching vibe products:', activeFilter.value);
            response = await fetchProductsUnified({ vibe: activeFilter.value, limit: 20 });
          } else if (activeFilter.type === 'collection') {
            console.log('[ProductCatalog] Fetching collection products:', activeFilter.value);
            response = await fetchProductsUnified({ collection: activeFilter.value, limit: 20 });
          } else if (activeFilter.type === 'userCollection') {
            // Fetch products from user's saved collection
            console.log('[ProductCatalog] Fetching user collection products:', activeFilter.value);
            response = await fetchProductsUnified({ userCollectionId: activeFilter.value, limit: 20 });
          } else if (activeFilter.type === 'search') {
            // Fetch products using AI search
            console.log('[ProductCatalog] Performing AI search:', activeFilter.value);
            const searchResponse = await searchAI(activeFilter.value);

            if (searchResponse.success) {
              // Map search results to component Product format
              const searchProducts: Product[] = searchResponse.results.map(p => ({
                id: p.product_id,
                name: p.name,
                price: 4000, // Default price as search API might not return it yet
                image: p.product_image_url,
                bookmarked: false,
                savedCollectionIds: [],
                brand: undefined,
                description: p.name,
                images: [p.product_image_url]
              }));
              setProducts(searchProducts);
              setLoading(false);
              return; // Exit early as we handled the response differently
            } else {
              response = { success: false, products: [], total: 0, hasMore: false, limit: 0, offset: 0 };
            }
          }
        }

        if (response && response.success) {
          console.log('[ProductCatalog] API response:', response);
          // Map unified API products to frontend format
          const mappedProducts: Product[] = response.products.map(p => ({
            id: p.productId,
            name: p.name,
            price: p.price || 4000,
            image: p.productImageUrl,
            bookmarked: p.isSaved,
            savedCollectionIds: p.savedCollectionIds || [],
            brand: p.brand?.name,
            description: p.description || p.name,
            images: p.imageList
          }));

          console.log('[ProductCatalog] Mapped products:', mappedProducts.length);
          setProducts(mappedProducts);
        } else {
          console.log('[ProductCatalog] No response or unsuccessful');
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter?.type, activeFilter?.value, activeFilter?.label]);

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
      <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
        {!hideHeader && (
          <SubpageHeader onBackClick={handleBackClick} />
        )}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading products...</p>
        </div>
        {!hideHeader && <BottomNav />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Header */}
      {!hideHeader && (
        <SubpageHeader
          onBackClick={handleBackClick}
          showDivider={false}
        />
      )}

      {/* Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        {/* Page Title */}
        <div className="pb-6">
          <h1 className="uppercase tracking-wide text-xl">{getPageTitle()}</h1>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col">
                {/* Product Image */}
                <div
                  className="relative bg-[#E5E5E5] aspect-[3/4] overflow-hidden cursor-pointer active:opacity-90 transition-opacity rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)]"
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
                    <p className="text-xs text-gray-700 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm mt-0.5">{"\u20B9"} {product.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={(e) => handleBookmarkClick(product, e)}
                    className="p-1 -mr-1 flex-shrink-0"
                  >
                    <BookmarkIcon isSaved={product.bookmarked} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation - only shown when not embedded */}
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
