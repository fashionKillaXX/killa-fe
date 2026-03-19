"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { GradientDivider } from "@/components/GradientDivider";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { Header } from "@/components/Header";
import { fetchHomepageStructure, type Product } from "@/services/homepage";
import { fetchProductsUnified } from "@/services/products";

/**
 * HomePage client component.
 * Renders the main homepage with featured product carousel, curations,
 * scenes, and vibes sections. Uses Next.js router for all navigation.
 */
export function HomePage() {
  const router = useRouter();

  // Carousel state
  const [carouselPosition, setCarouselPosition] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);

  // Data state
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string; items: Product[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const structure = await fetchHomepageStructure();
        setScenes(structure.scenes);
        setVibes(structure.vibes);
        setCollections(structure.collections.map(c => ({
          id: c.id,
          name: c.name,
          items: []
        })));

        const featuredResponse = await fetchProductsUnified({ featured: true, limit: 5 });
        if (featuredResponse.success) {
          setFeaturedProducts(featuredResponse.products);
        }
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    if (carouselPosition !== undefined && carouselPosition !== carouselApi.selectedScrollSnap()) {
      carouselApi.scrollTo(carouselPosition, true);
    }
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => {
      const newPosition = carouselApi.selectedScrollSnap();
      setCurrentSlide(newPosition);
      setCarouselPosition(newPosition);
    });
  }, [carouselApi, carouselPosition]);

  const CATEGORY_STYLES: Record<string, { src: string; className?: string }> = {
    "static distortion": { src: "https://images.unsplash.com/photo-1550614000-4b9519e02a48?w=800&q=80" },
    "midnight voltage": { src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80" },
    "urban flux": { src: "https://images.unsplash.com/photo-1523396896302-804197452237?w=800&q=80" },
    "digital haze": { src: "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=800&q=80" },
    "party": { src: "/gradient_liquid_1.png" },
    "work": { src: "/gradient_liquid_2.png" },
    "casual": { src: "/gradient_liquid_3.png" },
    "gym": { src: "/gradient_liquid_1.png", className: "hue-rotate-[90deg] brightness-110" },
    "date night": { src: "/gradient_liquid_1.png", className: "hue-rotate-[290deg] saturate-150" },
    "everyday": { src: "/gradient_liquid_3.png", className: "hue-rotate-[45deg] saturate-[0.8]" },
    "streetwear": { src: "/gradient_liquid_2.png", className: "hue-rotate-[180deg] contrast-125" },
    "minimalist": { src: "/gradient_liquid_2.png", className: "grayscale brightness-110" },
    "vintage": { src: "/gradient_liquid_3.png", className: "hue-rotate-[200deg] sepia-[0.3]" },
    "bohemian": { src: "/gradient_liquid_3.png", className: "sepia contrast-110" },
    "chic": { src: "/gradient_liquid_1.png", className: "hue-rotate-[45deg] saturate-[0.8]" },
    "trendy": { src: "/gradient_liquid_1.png", className: "hue-rotate-[180deg] brightness-110" },
    "classic": { src: "/gradient_liquid_2.png", className: "grayscale contrast-125" },
    "artistic": { src: "/gradient_liquid_1.png", className: "hue-rotate-[270deg] contrast-110" },
  };

  const getCategoryStyle = (name: string, fallbackSrc?: string) => {
    const lowerName = name.toLowerCase();
    if (CATEGORY_STYLES[lowerName]) return CATEGORY_STYLES[lowerName];
    const key = Object.keys(CATEGORY_STYLES).find(k => lowerName.includes(k));
    if (key) return CATEGORY_STYLES[key];
    return { src: fallbackSrc || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" };
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md md:max-w-7xl mx-auto">
      {/* Desktop top nav */}
      <DesktopNav />
      {/* Mobile header */}
      <Header />

      {/* Content */}
      <div className="flex-1 pb-24 md:pb-12 overflow-y-auto">
        {/* Featured Carousel */}
        <div className="pt-2 md:pt-8 pb-6 md:pb-10">
          <h2 className="text-center mb-4 md:mb-6 px-6">Spotlight</h2>

          <div className="relative">
            {/* Carousel — constrained on mobile, wider on desktop */}
            <div className="px-16 md:px-0 md:max-w-2xl md:mx-auto lg:max-w-3xl">
              <Carousel
                setApi={setCarouselApi}
                opts={{ align: "center", loop: true }}
              >
                <CarouselContent>
                  {featuredProducts.map((product, index) => (
                    <CarouselItem key={product.productId}>
                      <div
                        className="aspect-square md:aspect-[4/3] bg-[#E5E5E5] overflow-hidden cursor-pointer transition-all active:opacity-90 md:hover:shadow-xl md:hover:scale-[1.01] duration-300 rounded-[8px] shadow-[0px_2px_4px_0px_rgba(14,31,53,0.12)]"
                        onClick={() => {
                          setCarouselPosition(index);
                          router.push('/products/' + product.productId);
                        }}
                      >
                        <ImageWithFallback
                          src={product.productImageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-center text-sm md:text-base text-gray-700 mt-4 uppercase tracking-wide">
                        {product.name}
                      </p>
                    </CarouselItem>
                  ))}
                  {featuredProducts.length === 0 && (
                    <CarouselItem>
                      <div className="aspect-square md:aspect-[4/3] bg-gray-100 flex items-center justify-center rounded-[8px]">
                        <p className="text-gray-400">Loading featured...</p>
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Navigation Chevrons */}
            <button
              onClick={() => carouselApi?.scrollPrev()}
              className="absolute left-[16.5px] md:left-4 lg:left-[calc(50%-26rem)] top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-full flex items-center justify-center p-px active:bg-gray-100 hover:bg-gray-100 transition-colors bg-white shadow-[0px_1px_2px_0px_rgba(14,31,53,0.08)]"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </button>
            <button
              onClick={() => carouselApi?.scrollNext()}
              className="absolute right-[16.5px] md:right-4 lg:right-[calc(50%-26rem)] top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-full flex items-center justify-center p-px active:bg-gray-100 hover:bg-gray-100 transition-colors bg-white shadow-[0px_1px_2px_0px_rgba(14,31,53,0.08)]"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </button>
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: featuredProducts.length || 5 }).map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? "bg-black" : "bg-gray-300"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Curations */}
        <div className="py-6 md:py-10">
          <GradientDivider className="mb-8" />
          <div className="px-6 md:px-8 lg:px-12">
            <h2 className="mb-2 text-center">Curations</h2>
            <p className="text-xs text-gray-500 text-center mb-6 md:mb-8" style={{ fontStyle: 'italic' }}>
              curated outfits from your fav homegrown brands
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-6 lg:gap-y-8">
              {collections.map((collection) => {
                const style = getCategoryStyle(collection.name, collection.items.length > 0 ? collection.items[0].productImageUrl : undefined);
                return (
                  <div
                    key={collection.id}
                    className="cursor-pointer group"
                    onClick={() => router.push('/products?collection=' + encodeURIComponent(collection.id))}
                  >
                    <div className="aspect-square bg-gray-50 border border-gray-200 overflow-hidden relative active:border-gray-300 transition-all duration-300 rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] md:group-hover:scale-[1.03] md:group-hover:shadow-lg">
                      <ImageWithFallback
                        src={style.src}
                        alt={collection.name}
                        className={`w-full h-full object-cover ${style.className || ''}`}
                      />
                    </div>
                    <p className="text-gray-700 mt-2 text-center lowercase md:group-hover:text-black transition-colors">
                      {collection.name}
                    </p>
                  </div>
                );
              })}
              {collections.length === 0 && !loading && (
                <p className="col-span-2 text-center text-gray-400 text-sm py-4">No curations found</p>
              )}
            </div>
          </div>
        </div>

        {/* Search by Scene */}
        <div className="py-8 md:py-10">
          <GradientDivider className="mb-8" />
          <div className="px-6 md:px-8 lg:px-12">
            <h2 className="mb-2 text-center">Search by Scene</h2>
            <p className="text-xs text-gray-500 text-center mb-6 md:mb-8 lowercase">
              browse looks by occasion
            </p>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-10">
              {scenes.map((scene, index) => {
                const style = getCategoryStyle(scene);
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => router.push('/products?scene=' + encodeURIComponent(scene))}
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gray-50 border border-gray-200 active:border-gray-300 transition-all duration-300 shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)] flex items-center justify-center overflow-hidden md:group-hover:scale-110 md:group-hover:shadow-md">
                      <ImageWithFallback
                        src={style.src}
                        alt={scene}
                        className={`w-full h-full object-cover ${style.className || ''}`}
                      />
                    </div>
                    <p className="text-gray-700 mt-3 text-center md:group-hover:text-black transition-colors">
                      {scene}
                    </p>
                  </div>
                );
              })}
              {scenes.length === 0 && !loading && (
                <p className="text-gray-400 text-sm">No scenes found</p>
              )}
            </div>
          </div>
        </div>

        {/* Find Your Vibe */}
        <div className="py-8 md:py-10">
          <GradientDivider className="mb-8" />
          <div className="px-6 md:px-8 lg:px-12">
            <h2 className="mb-2 text-center">Find Your Vibe</h2>
            <p className="text-xs text-gray-500 text-center mb-6 md:mb-8 lowercase">
              browse looks by your style
            </p>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-10">
              {vibes.map((vibe, index) => {
                const style = getCategoryStyle(vibe);
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => router.push('/products?vibe=' + encodeURIComponent(vibe))}
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gray-50 border border-gray-200 active:border-gray-300 transition-all duration-300 shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)] flex items-center justify-center overflow-hidden md:group-hover:scale-110 md:group-hover:shadow-md">
                      <ImageWithFallback
                        src={style.src}
                        alt={vibe}
                        className={`w-full h-full object-cover ${style.className || ''}`}
                      />
                    </div>
                    <p className="text-gray-700 mt-3 text-center md:group-hover:text-black transition-colors">
                      {vibe}
                    </p>
                  </div>
                );
              })}
              {vibes.length === 0 && !loading && (
                <p className="text-gray-400 text-sm">No vibes found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
