"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SaveToCollectionSheet } from "@/components/SaveToCollectionSheet";
import { BookmarkIcon } from "@/components/shared/BookmarkIcon";
import { BottomNav } from "@/components/BottomNav";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  bookmarked: boolean;
  savedCollectionIds: string[];
  count?: number;
  brand?: string;
  brandLogo?: string;
  brandInstagram?: string;
  description?: string;
  images?: string[];
}

interface CategoryProductsPageProps {
  categoryName: string;
}

export function CategoryProductsPage({ categoryName }: CategoryProductsPageProps) {
  const router = useRouter();
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [productToSave, setProductToSave] = useState<Product | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock products for the category
  const [products] = useState<Product[]>([
    {
      id: 1,
      name: "REGULAR FIT VELVET BLAZER",
      price: 10950.0,
      image: "https://images.unsplash.com/photo-1646178071012-7bf3efe0ddfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHZlbHZldCUyMGJsYXplcnxlbnwxfHx8fDE3NjEwNjA3OTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bookmarked: false,
      savedCollectionIds: [],
      brand: "House of CB",
      brandInstagram: "houseofcb",
      description: "Elevate your evening look with this luxurious velvet blazer. Tailored to perfection with a modern fit, featuring notched lapels and button closure.",
    },
    {
      id: 2,
      name: "TEXTURED VELVET PANTS",
      price: 4950.0,
      image: "https://images.unsplash.com/photo-1758387813664-5cd1211304f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGRyZXNzJTIwcGFudHN8ZW58MXx8fHwxNzYxMDYwNzkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bookmarked: false,
      savedCollectionIds: [],
      count: 1,
      brand: "Reformatio",
      brandInstagram: "reformatio.in",
      description: "High-waisted velvet pants with a sleek silhouette. Perfect for both formal and casual occasions.",
    },
    {
      id: 3,
      name: "GLOSSY LOAFERS",
      price: 5950.0,
      image: "https://images.unsplash.com/photo-1673675270277-95e45ee5d2e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGxlYXRoZXIlMjBsb2FmZXJzfGVufDF8fHx8MTc2MTA2MDc5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bookmarked: false,
      savedCollectionIds: [],
      brand: "Cord Studio",
      brandInstagram: "cordstudio",
      description: "Premium leather loafers with a polished finish. Crafted for comfort and style.",
    },
    {
      id: 4,
      name: "EMBOSSED MOCK CROC BAG",
      price: 5050.0,
      image: "https://images.unsplash.com/photo-1758542988969-39a10168b2ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGxlYXRoZXIlMjBoYW5kYmFnfGVufDF8fHx8MTc2MDk2NzgyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bookmarked: false,
      savedCollectionIds: [],
      brand: "Torani",
      brandInstagram: "torani.in",
      description: "Statement handbag with embossed croc texture. Features adjustable strap and gold hardware.",
    },
    {
      id: 5,
      name: "PREMIUM COTTON SHIRT",
      price: 3950.0,
      image: "https://images.unsplash.com/photo-1518419973-a5f458580a50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHNoaXJ0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NjEwMjk1NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bookmarked: false,
      savedCollectionIds: [],
      brand: "House of CB",
      brandInstagram: "houseofcb",
      description: "Classic cotton shirt with a contemporary twist. Versatile piece for any wardrobe.",
    },
    {
      id: 6,
      name: "TAILORED SHORTS",
      price: 2950.0,
      image: "https://images.unsplash.com/photo-1628476801147-b3e3cb99fe68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHNob3J0cyUyMGZhc2hpb258ZW58MXx8fHwxNzYxMDYwNzkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bookmarked: false,
      savedCollectionIds: [],
      brand: "Reformatio",
      brandInstagram: "reformatio.in",
      description: "Tailored shorts with a relaxed fit. Perfect for warm weather styling.",
    },
  ]);

  const handleBookmarkClick = (product: Product) => {
    setProductToSave(product);
    setSaveSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Header */}
      <SubpageHeader onBackClick={() => router.back()} />

      {/* Category Title */}
      <div className="px-6 pt-2 pb-6">
        <h2 className="text-center lowercase">{categoryName}</h2>
      </div>

      {/* Product Grid */}
      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col">
              {/* Product Image */}
              <div
                className="relative bg-[#E5E5E5] aspect-[3/4] overflow-hidden cursor-pointer active:opacity-90 transition-opacity rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)]"
                onClick={() => router.push('/products/' + String(product.id))}
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
                  onClick={() => handleBookmarkClick(product)}
                  className="p-1 -mr-1 flex-shrink-0"
                >
                  <BookmarkIcon isSaved={product.bookmarked} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save to Collection Sheet */}
      {productToSave && (
        <SaveToCollectionSheet
          open={saveSheetOpen}
          onOpenChange={setSaveSheetOpen}
          productId={String(productToSave.id)}
          productName={productToSave.name}
          savedCollectionIds={productToSave.savedCollectionIds}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
