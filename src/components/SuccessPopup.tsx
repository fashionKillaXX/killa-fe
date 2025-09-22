"use client";

import { useSurvey } from "@/contexts/SurveyContext";

export default function SuccessPopup() {
  const { startNewSurvey, totalProductsRated, products, resetSurvey } =
    useSurvey();

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:justify-center font-serif">
      <div className="max-w-2xl mx-auto w-full flex flex-col shadow-2xl rounded-none lg:rounded-2xl bg-white overflow-hidden min-h-[90vh] relative border border-gray-200">
        {/* Premium Success Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-16 lg:p-20 text-center">
          {/* Minimalist Success Icon */}
          <div className="mb-12 lg:mb-16">
            <div className="w-20 h-20 lg:w-24 lg:h-24 border border-black rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 lg:w-12 lg:h-12 text-black"
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

          {/* Elegant Typography */}
          <div className="mb-16 lg:mb-20">
            <h1 className="text-3xl lg:text-4xl font-light text-black mb-6 tracking-[0.2em]">
              THANK YOU
            </h1>
            <p className="text-base lg:text-lg text-gray-600 leading-loose font-light tracking-wide max-w-md mx-auto">
              Your feedback has been successfully submitted.
              <br />
              We appreciate your valuable input.
            </p>
            <div className="mt-8 text-sm text-gray-500 tracking-wide">
              Products rated: {totalProductsRated} of {products.length}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startNewSurvey}
              className="border border-black px-8 lg:px-12 py-4 lg:py-5 text-black text-sm lg:text-base font-light tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 focus:outline-none uppercase"
            >
              Rate Next Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
