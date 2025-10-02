"use client";

import { Product } from "@/lib/api";
import { useSurvey } from "@/contexts/SurveyContext";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ProductDisplayProps {
  product: Product;
  onRatingSelect: (rating: number) => void;
  onSkip: () => void;
}

export default function ProductDisplay({
  product,
  onRatingSelect,
  onSkip,
}: ProductDisplayProps) {
  const {
    showFirstTick,
    showSecondTick,
    totalProductsRated,
    products,
    isSubmitting,
  } = useSurvey();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);
  const isProcessing = showFirstTick || showSecondTick || isSubmitting;

  // Reset image state when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsImageLoading(true);
    setDragOffset(0);
    setIsDragging(false);
  }, [product.id]);

  // Get available images - use image_list if available, otherwise fallback to image_url
  const availableImages =
    product.image_list && product.image_list.length > 0
      ? product.image_list
      : [product.image_url];

  const nextImage = () => {
    if (availableImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % availableImages.length);
    }
  };

  const previousImage = () => {
    if (availableImages.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + availableImages.length) % availableImages.length
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    setDragOffset(currentTouch - touchStart);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !touchStart || touchEnd === 0) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      previousImage();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setTouchStart(e.clientX);
    setTouchEnd(0);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setTouchEnd(e.clientX);
    setDragOffset(e.clientX - touchStart);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !touchStart || touchEnd === 0) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      previousImage();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Reset loading state when product or image changes
  useEffect(() => {
    setIsImageLoading(true);
  }, [product.id, currentImageIndex]);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product.id]);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-center font-serif py-4 lg:py-8">
      <div className="max-w-2xl mx-auto w-full flex flex-col shadow-2xl rounded-none lg:rounded-2xl bg-white overflow-hidden relative border border-gray-200">
        {/* Image Container */}
        {/* Clean white tick overlays */}
        {showSecondTick && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-20">
            <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white border border-black rounded-full flex items-center justify-center shadow-2xl">
              <svg
                className="w-16 h-16 lg:w-20 lg:h-20 text-black"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Image Carousel Section */}
        <div className="flex items-center justify-center p-6 lg:p-8">
          <div className="relative w-full max-w-sm lg:max-w-md aspect-square bg-gray-50 overflow-hidden border border-black">
            <div
              ref={imageRef}
              className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setIsDragging(false);
                setDragOffset(0);
              }}
            >
              {/* Loading Spinner */}
              {isImageLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Main Image with smooth transform */}
              <div
                className="relative w-full h-full transition-transform duration-300 ease-out"
                style={{
                  transform: isDragging
                    ? `translateX(${dragOffset * 0.3}px)`
                    : "translateX(0)",
                }}
              >
                <Image
                  src={availableImages[currentImageIndex]}
                  alt={product.name || `Product ${product.id}`}
                  fill
                  className="object-cover transition-all duration-500"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                  draggable={false}
                />
              </div>

              {/* Desktop Navigation Arrows - only show on web */}
              {availableImages.length > 1 && (
                <div className="hidden md:block">
                  <button
                    onClick={previousImage}
                    disabled={isProcessing}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center hover:bg-white hover:shadow-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group z-10"
                  >
                    <svg
                      className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={isProcessing}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center hover:bg-white hover:shadow-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group z-10"
                  >
                    <svg
                      className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Minimalist fallback */}
              <div className="w-full h-full bg-gray-100 flex items-center justify-center hidden">
                <div className="text-center">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-black font-light text-sm tracking-wide">
                    IMAGE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Thumbnail Navigation - only show if multiple images and not loading */}
        {availableImages.length > 1 && !isImageLoading && (
          <div className="flex justify-center gap-2 mb-4 px-4">
            {/* Show first 5 thumbnails */}
            {availableImages.slice(0, Math.min(5, availableImages.length)).map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                disabled={isProcessing}
                className={`relative w-12 h-12 border-2 transition-all duration-300 disabled:opacity-50 ${
                  index === currentImageIndex
                    ? "border-black"
                    : "border-gray-300 hover:border-gray-500"
                }`}
              >
                <Image
                  src={imageUrl}
                  alt={`View ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </button>
            ))}
            
            {/* Show indicator with current position if more than 5 images */}
            {availableImages.length > 5 && (
              <div className="flex items-center gap-2 ml-2">
                <div className="text-xs text-gray-500 font-light">
                  +{availableImages.length - 5} more {availableImages.length - 5 === 1 ? 'image' : 'images'}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Show loading placeholder for thumbnails when image is loading */}
        {availableImages.length > 1 && isImageLoading && (
          <div className="flex justify-center gap-2 mb-4 px-4">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}


        {/* Premium Content Section */}
        <div className="px-4 lg:px-8 pb-6 lg:pb-8">
          {/* Typography-focused Question */}
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-lg lg:text-2xl font-light text-black tracking-[0.1em] lg:tracking-[0.15em] leading-relaxed">
              WOULD YOU CONSIDER BUYING THIS ITEM FOR YOURSELF?
            </h1>
          </div>

          {/* Minimalist Rating Scale */}
          <div className="mb-6 lg:mb-8">
            <div className="flex justify-center gap-3 lg:gap-6 mb-4 lg:mb-6">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => !isProcessing && onRatingSelect(num)}
                  disabled={isProcessing}
                  className={`w-10 h-10 lg:w-14 lg:h-14 border border-black flex items-center justify-center text-base lg:text-xl font-light text-black transition-all duration-300 focus:outline-none active:scale-95 ${
                    isProcessing
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-black hover:text-white cursor-pointer"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs lg:text-sm text-gray-600 px-2 lg:px-8 font-light tracking-wide lg:tracking-widest uppercase">
              <span>No Scene</span>
              <span>100%</span>
            </div>
          </div>

          {/* Minimal Skip Button */}
          <div className="flex justify-center mt-4 lg:mt-6">
            <button
              onClick={() => !isProcessing && onSkip()}
              disabled={isProcessing}
              className={`border border-gray-400 px-6 lg:px-12 py-2 lg:py-4 text-gray-600 text-xs lg:text-base font-light tracking-[0.15em] lg:tracking-[0.2em] transition-all duration-300 focus:outline-none uppercase ${
                isProcessing
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-black hover:text-black cursor-pointer"
              }`}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
