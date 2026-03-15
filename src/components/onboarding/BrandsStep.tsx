"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { fetchAvailableBrands, type Brand } from "@/services/preferences";

interface BrandsStepProps {
  onNext: (brands: string[]) => void;
  onBack: () => void;
  initialValue: string[];
}

export function BrandsStep({ onNext, onBack, initialValue }: BrandsStepProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await fetchAvailableBrands();
      if (response.success) {
        setBrands(response.brands);

        // Filter initialValue to only include valid UUIDs from the fetched brands
        const validBrandIds = response.brands.map(b => b.id);
        const validInitialValues = initialValue.filter(id => validBrandIds.includes(id));
        setSelectedBrandIds(validInitialValues);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) => {
      if (prev.includes(brandId)) {
        return prev.filter((id) => id !== brandId);
      } else {
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, brandId];
      }
    });
  };

  const handleNext = () => {
    if (selectedBrandIds.length >= 3) {
      onNext(selectedBrandIds);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center max-w-md mx-auto">
        <p className="text-gray-500">Loading brands...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <button
          onClick={onBack}
          className="p-2 -ml-2 active:bg-gray-100 transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-8 py-6 overflow-hidden">
        <h2 className="mb-3 text-center" style={{ fontSize: "1.75rem" }}>
          Choose your favorite brands
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Pick at least 3, maximum 5 ({selectedBrandIds.length}/5 selected)
        </p>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-4 pl-14 pr-5 bg-white border border-gray-200 text-black placeholder:text-gray-400 focus:outline-none focus:border-gray-300 rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)]"
          />
        </div>

        {/* Brands Grid */}
        <div className="flex-1 overflow-y-auto pb-4 -mx-2">
          <div className="grid grid-cols-3 gap-4 px-2">
            {filteredBrands.map((brand) => {
              const isSelected = selectedBrandIds.includes(brand.id);
              const isDisabled = !isSelected && selectedBrandIds.length >= 5;

              return (
                <button
                  key={brand.id}
                  onClick={() => toggleBrand(brand.id)}
                  disabled={isDisabled}
                  className={`aspect-square border flex flex-col items-center justify-center p-4 transition-all rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] ${isSelected
                    ? "border-black bg-gray-50"
                    : isDisabled
                      ? "border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                >
                  <div className="w-full aspect-square bg-gray-100 mb-3 flex items-center justify-center rounded-[8px]">
                    <span className="text-3xl text-gray-600">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[12px] text-center uppercase tracking-wider line-clamp-2 leading-tight">
                    {brand.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-8 pb-12 flex justify-center">
        <button
          onClick={handleNext}
          disabled={selectedBrandIds.length < 3}
          className={`px-8 py-4 uppercase tracking-widest transition-all rounded-[8px] ${selectedBrandIds.length >= 3
            ? "bg-black text-white hover:bg-black/90"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
