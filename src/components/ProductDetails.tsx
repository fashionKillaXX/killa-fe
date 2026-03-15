"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instagram, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SaveToCollectionSheet } from "@/components/SaveToCollectionSheet";
import { BookmarkIcon } from "@/components/shared/BookmarkIcon";
import { GradientDivider } from "@/components/GradientDivider";
import { PrimaryButton } from "@/components/shared/PrimaryButton";
import { SecondaryButton } from "@/components/shared/SecondaryButton";
import { BottomNav } from "@/components/BottomNav";
import { fetchProductDetail, type ProductDetail } from "@/services/products";

interface ProductDetailsProps {
  productId: string;
}

/**
 * Product detail view with image carousel, brand info, and action buttons.
 * Fetches product data by ID and displays full product information.
 */
export function ProductDetails({ productId }: ProductDetailsProps) {
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);

  // Fetch product details
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await fetchProductDetail(productId);
        if (response.success && response.product) {
          setProduct(response.product);

          // Preload images
          if (response.product.imageList && response.product.imageList.length > 0) {
            response.product.imageList.forEach((src) => {
              const img = new Image();
              img.src = src;
            });
          }
        } else {
          setError(response.error || "Failed to load product");
        }
      } catch (err) {
        setError("An error occurred while loading the product");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }

    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [productId]);

  const handleBack = () => {
    router.back();
  };

  // Fallback spinner while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
        <SubpageHeader onBackClick={handleBack} showDivider={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
        <SubpageHeader onBackClick={handleBack} showDivider={false} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-500 mb-4">{error || "Product not found"}</p>
          <PrimaryButton onClick={handleBack}>Go Back</PrimaryButton>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Use multiple images if available, otherwise use the main image
  const productImages = product.imageList && product.imageList.length > 0
    ? product.imageList
    : [product.productImageUrl];

  const handleViewProduct = () => {
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Determine Instagram link: use brandInstagram if available, otherwise fallback to productUrl
  const instagramLink = product.brand?.brandInstagram
    ? `https://instagram.com/${product.brand.brandInstagram}`
    : product.productUrl;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Header */}
      <SubpageHeader
        onBackClick={handleBack}
        showDivider={false}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="pt-8">
          {/* Product Images Carousel with navigation */}
          <div className="relative">
            {/* Carousel Container with centered content */}
            <div className="px-16">
              <div className="bg-[#E5E5E5] aspect-square relative rounded-[8px] overflow-hidden shadow-[0px_2px_4px_0px_rgba(14,31,53,0.12)]">
                <ImageWithFallback
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Navigation Chevrons - centered to image only */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex === 0 ? productImages.length - 1 : selectedImageIndex - 1)}
                  className="absolute left-[16.5px] top-1/2 -translate-y-1/2 w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center p-px active:bg-gray-100 transition-colors bg-white shadow-[0px_1px_2px_0px_rgba(14,31,53,0.08)]"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex === productImages.length - 1 ? 0 : selectedImageIndex + 1)}
                  className="absolute right-[16.5px] top-1/2 -translate-y-1/2 w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center p-px active:bg-gray-100 transition-colors bg-white shadow-[0px_1px_2px_0px_rgba(14,31,53,0.08)]"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              </>
            )}
          </div>

          {/* Carousel Indicators */}
          {productImages.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-6">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${selectedImageIndex === index
                    ? "bg-black"
                    : "bg-gray-300"
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="px-4 mt-6">
          <h1 className="text-xl uppercase tracking-wide">{product.name}</h1>
          <p className="text-sm mt-2">{"\u20B9"} {product.price.toFixed(2)}</p>

          {product.description && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Brand Info */}
        <div className="mt-6 pt-6">
          <GradientDivider className="mb-6" />
          <div className="px-4">
            <div className="flex items-center gap-3">
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-gray-50 border border-gray-200 active:bg-gray-100 transition-colors rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.08)]"
                aria-label={`Visit ${product.brand?.name || 'Brand'} on Instagram`}
              >
                <Instagram className="w-5 h-5" />
              </a>
              {product.brand?.brandLogo && (
                <div className="w-12 h-12 bg-white overflow-hidden flex items-center justify-center rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)]">
                  <ImageWithFallback
                    src={product.brand.brandLogo}
                    alt={product.brand.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Brand</p>
                <a
                  href={product.brand?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm mt-0.5 font-medium hover:underline block"
                >
                  {product.brand?.name || "Unknown Brand"}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 mt-6 flex gap-3">
          <PrimaryButton
            className="flex-1 gap-2"
            onClick={handleViewProduct}
          >
            <span className="text-sm">View product</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </PrimaryButton>
          <SecondaryButton
            onClick={() => setSaveSheetOpen(true)}
            className="w-auto"
          >
            <BookmarkIcon isSaved={product.isSaved} className="w-5 h-5" />
          </SecondaryButton>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Save to Collection Sheet */}
      <SaveToCollectionSheet
        open={saveSheetOpen}
        onOpenChange={setSaveSheetOpen}
        productId={product.productId}
        productName={product.name}
        savedCollectionIds={product.savedCollectionIds || []}
        onSaveSuccess={(updatedIds) => {
          // Update the product's savedCollectionIds in local state
          setProduct(prev => prev ? {
            ...prev,
            savedCollectionIds: updatedIds,
            isSaved: updatedIds.length > 0
          } : null);
        }}
      />
    </div>
  );
}
