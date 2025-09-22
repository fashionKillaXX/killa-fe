"use client";

import { Product } from '@/lib/api';
import { useSurvey } from '@/contexts/SurveyContext';

interface ProductDisplayProps {
  product: Product;
  onRatingSelect: (rating: number) => void;
  onSkip: () => void;
}

export default function ProductDisplay({ product, onRatingSelect, onSkip }: ProductDisplayProps) {
  const { currentSurveyStep, showFirstTick, showSecondTick, totalProductsRated, products, showSuccess } = useSurvey();
  const isSecondView = currentSurveyStep === 1;
  const isProcessing = showFirstTick || showSecondTick || showSuccess;

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-center font-serif py-4 lg:py-8">
      <div className="max-w-2xl mx-auto w-full flex flex-col shadow-2xl rounded-none lg:rounded-2xl bg-white overflow-hidden relative border border-gray-200">
        {/* Image Container */}
        {/* Clean white tick overlays */}
        {showFirstTick && (
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

        {/* Minimalist Image Section */}
        <div className="flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-sm lg:max-w-md aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative border border-black">
            <img
              src={product.image_url}
              alt={`Product ${product.id}`}
              className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Minimalist fallback */}
            <div className="w-full h-full bg-gray-100 flex items-center justify-center hidden">
              <div className="text-center">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-black font-light text-sm tracking-wide">IMAGE</p>
              </div>
            </div>
          </div>
        </div>

            {/* Minimalist Progress */}
            <div className="flex justify-center gap-2 mb-6 lg:mb-8">
              <div className={`h-px w-8 transition-all duration-300 ${currentSurveyStep === 0 ? 'bg-black' : 'bg-gray-300'}`} />
              <div className={`h-px w-8 transition-all duration-300 ${currentSurveyStep === 1 ? 'bg-black' : 'bg-gray-300'}`} />
            </div>
            
            {/* Product Counter */}
            <div className="flex justify-center mb-4 lg:mb-6">
              <div className="text-gray-500 text-xs lg:text-sm font-light tracking-wide">
                Product {totalProductsRated + 1} of {products.length}
              </div>
            </div>

        {/* Elegant Price Display */}
        {isSecondView && (
          <div className="flex justify-center mb-4 lg:mb-6">
            <div className="border border-black px-4 lg:px-8 py-2 lg:py-3">
              <span className="text-black font-light text-base lg:text-xl tracking-[0.15em] lg:tracking-[0.2em]">
                ₹{product.price.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Premium Content Section */}
        <div className="px-4 lg:px-8 pb-6 lg:pb-8">
              {/* Typography-focused Question */}
              <div className="text-center mb-6 lg:mb-8">
                <h1 className="text-lg lg:text-2xl font-light text-black mb-2 lg:mb-3 tracking-[0.1em] lg:tracking-[0.15em] leading-relaxed">
                  HOW LIKELY ARE YOU
                </h1>
                <h2 className="text-lg lg:text-2xl font-light text-black tracking-[0.1em] lg:tracking-[0.15em] leading-relaxed">
                  {isSecondView ? "TO BUY THIS?" : "TO WEAR THIS?"}
                </h2>
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
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-black hover:text-white cursor-pointer'
                    }`}
                  >
                    {num}
                  </button>
                ))}
            </div>
            <div className="flex justify-between text-xs lg:text-sm text-gray-600 px-2 lg:px-8 font-light tracking-wide lg:tracking-widest uppercase">
              <span>No Scene</span>
              <span>Very Likely</span>
            </div>
          </div>

              {/* Minimal Skip Button - Only show on first survey */}
              {!isSecondView && (
                <div className="flex justify-center mt-4 lg:mt-6">
                  <button
                    onClick={() => !isProcessing && onSkip()}
                    disabled={isProcessing}
                    className={`border border-gray-400 px-6 lg:px-12 py-2 lg:py-4 text-gray-600 text-xs lg:text-base font-light tracking-[0.15em] lg:tracking-[0.2em] transition-all duration-300 focus:outline-none uppercase ${
                      isProcessing 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-black hover:text-black cursor-pointer'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
