"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, X, Check, ArrowUpDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { fetchSearchFilters, type FilterOption, type SearchFiltersResponse, type SearchFilters as SearchFiltersType } from "@/services/search";

/** Maps filter keys to their display labels */
const FILTER_CONFIG: { key: FilterKey; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "color", label: "Color" },
  { key: "vibe", label: "Vibe" },
  { key: "occasion", label: "Occasion" },
  { key: "price", label: "Price" },
];

/** Sort options available to the user */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low \u2192 High" },
  { value: "price_desc", label: "Price: High \u2192 Low" },
  { value: "newest", label: "Newest" },
];

type FilterKey = "category" | "color" | "vibe" | "occasion" | "price";

/** Mapping from FilterKey to the backend filters response field */
const FILTER_TO_OPTIONS_KEY: Record<Exclude<FilterKey, "price">, keyof Pick<SearchFiltersResponse, "categories" | "colors" | "vibes" | "occasions">> = {
  category: "categories",
  color: "colors",
  vibe: "vibes",
  occasion: "occasions",
};

/** Price range presets */
const PRICE_RANGES: FilterOption[] = [
  { value: "0-1000", label: "Under \u20B91,000", count: 0 },
  { value: "1000-2500", label: "\u20B91,000 - \u20B92,500", count: 0 },
  { value: "2500-5000", label: "\u20B92,500 - \u20B95,000", count: 0 },
  { value: "5000-10000", label: "\u20B95,000 - \u20B910,000", count: 0 },
  { value: "10000-", label: "Over \u20B910,000", count: 0 },
];

interface SearchFiltersProps {
  /** Current active filters as a map of filter key to selected values */
  activeFilters: Record<string, string[]>;
  /** Current sort value */
  activeSort: string;
  /** Called when filters change */
  onFiltersChange: (filters: Record<string, string[]>) => void;
  /** Called when sort changes */
  onSortChange: (sort: string) => void;
}

export function SearchFilters({
  activeFilters,
  activeSort,
  onFiltersChange,
  onSortChange,
}: SearchFiltersProps) {
  const [filtersData, setFiltersData] = useState<SearchFiltersResponse | null>(null);
  // Which filter chip is open (mobile sheet or desktop popover)
  const [openFilter, setOpenFilter] = useState<FilterKey | "sort" | null>(null);
  // Track desktop vs mobile for rendering the right picker
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Fetch filter options on mount
  useEffect(() => {
    const load = async () => {
      const res = await fetchSearchFilters();
      if (res.success) {
        setFiltersData(res);
      }
    };
    load();
  }, []);

  /** Get the options for a given filter key */
  const getOptions = (key: FilterKey): FilterOption[] => {
    if (key === "price") return PRICE_RANGES;
    if (!filtersData) return [];
    return filtersData[FILTER_TO_OPTIONS_KEY[key]] || [];
  };

  /** Count of active selections for a filter key */
  const getActiveCount = (key: string): number => {
    return (activeFilters[key] || []).length;
  };

  /** Total number of active filter selections (excluding sort) */
  const totalActiveFilters = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);

  /** Toggle a value within a multi-select filter */
  const toggleFilterValue = (key: string, value: string) => {
    const current = activeFilters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...activeFilters, [key]: updated });
  };

  /** Remove a single active filter pill */
  const removeFilterValue = (key: string, value: string) => {
    const current = activeFilters[key] || [];
    onFiltersChange({ ...activeFilters, [key]: current.filter(v => v !== value) });
  };

  /** Clear all filters and reset sort */
  const clearAll = useCallback(() => {
    onFiltersChange({});
    onSortChange("relevance");
  }, [onFiltersChange, onSortChange]);

  /** Find display label for a filter value */
  const getDisplayLabel = (key: FilterKey, value: string): string => {
    const options = getOptions(key);
    const opt = options.find(o => o.value === value);
    return opt?.label || value;
  };

  // Build list of active filter pills for display
  const activePills: { key: FilterKey; value: string; label: string }[] = [];
  for (const { key } of FILTER_CONFIG) {
    for (const val of activeFilters[key] || []) {
      activePills.push({ key, value: val, label: getDisplayLabel(key, val) });
    }
  }

  const hasSortActive = activeSort !== "relevance";

  /** Render the option list content for a filter (shared between sheet and popover) */
  const renderFilterOptions = (key: FilterKey) => {
    const options = getOptions(key);
    const selected = activeFilters[key] || [];

    if (options.length === 0) {
      return <p className="text-sm text-gray-400 py-4 text-center">No options available</p>;
    }

    return (
      <div className="flex flex-col">
        {options.map(opt => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleFilterValue(key, opt.value)}
              className="flex items-center justify-between px-1 py-3 text-left hover:bg-gray-50 active:bg-gray-50 transition-colors rounded-md"
            >
              <span className="text-sm text-gray-800">{opt.label}</span>
              <div className="flex items-center gap-2">
                {opt.count > 0 && (
                  <span className="text-xs text-gray-400">{opt.count}</span>
                )}
                {isSelected && (
                  <Check className="w-4 h-4 text-black" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  /** Render the sort options (single-select) */
  const renderSortOptions = () => (
    <div className="flex flex-col">
      {SORT_OPTIONS.map(opt => {
        const isSelected = activeSort === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              onSortChange(opt.value);
              setOpenFilter(null);
            }}
            className="flex items-center justify-between px-1 py-3 text-left hover:bg-gray-50 active:bg-gray-50 transition-colors rounded-md"
          >
            <span className="text-sm text-gray-800">{opt.label}</span>
            {isSelected && <Check className="w-4 h-4 text-black" />}
          </button>
        );
      })}
    </div>
  );

  /** Render a single filter chip */
  const renderChip = (key: FilterKey | "sort", label: string, count: number, icon?: React.ReactNode) => {
    const isActive = count > 0 || (key === "sort" && hasSortActive);
    const chipLabel = key === "sort" && hasSortActive
      ? SORT_OPTIONS.find(o => o.value === activeSort)?.label || label
      : label;

    const chipContent = (
      <button
        onClick={() => setOpenFilter(openFilter === key ? null : key)}
        className={`
          flex items-center gap-1.5 rounded-full border text-sm px-4 py-2 whitespace-nowrap transition-all
          ${isActive
            ? "bg-[#030213] text-white border-[#030213]"
            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 active:bg-gray-50"
          }
        `}
      >
        {icon}
        <span>{chipLabel}</span>
        {count > 0 && !icon && (
          <span className="bg-white/20 text-[11px] rounded-full px-1.5 min-w-[18px] text-center">
            {count}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openFilter === key ? "rotate-180" : ""}`} />
      </button>
    );

    // Desktop: use popover
    if (isDesktop) {
      return (
        <Popover
          key={key}
          open={openFilter === key}
          onOpenChange={(open) => setOpenFilter(open ? key : null)}
        >
          <PopoverTrigger asChild>{chipContent}</PopoverTrigger>
          <PopoverContent align="start" className="w-64 max-h-80 overflow-y-auto p-3 bg-white">
            {key === "sort" ? renderSortOptions() : renderFilterOptions(key as FilterKey)}
          </PopoverContent>
        </Popover>
      );
    }

    // Mobile: just the button (sheet controlled separately)
    return <React.Fragment key={key}>{chipContent}</React.Fragment>;
  };

  return (
    <div className="space-y-3">
      {/* Horizontal scrollable chip row */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {FILTER_CONFIG.map(({ key, label }) =>
          renderChip(key, label, getActiveCount(key))
        )}
        {renderChip("sort", "Sort", 0, <ArrowUpDown className="w-3.5 h-3.5" />)}
      </div>

      {/* Active filter pills */}
      {(activePills.length > 0 || hasSortActive) && (
        <div className="flex flex-wrap gap-2 items-center">
          {activePills.map(pill => (
            <span
              key={`${pill.key}-${pill.value}`}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs rounded-full px-3 py-1.5"
            >
              {pill.label}
              <button
                onClick={() => removeFilterValue(pill.key, pill.value)}
                className="hover:text-black active:text-black transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {hasSortActive && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs rounded-full px-3 py-1.5">
              {SORT_OPTIONS.find(o => o.value === activeSort)?.label}
              <button
                onClick={() => onSortChange("relevance")}
                className="hover:text-black active:text-black transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-black active:text-black underline transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile bottom sheet for filters (only rendered on non-desktop) */}
      {!isDesktop && openFilter && openFilter !== "sort" && (
        <Sheet open={true} onOpenChange={(open) => { if (!open) setOpenFilter(null); }}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
            <SheetHeader onClose={() => setOpenFilter(null)}>
              <SheetTitle>
                {FILTER_CONFIG.find(f => f.key === openFilter)?.label}
              </SheetTitle>
            </SheetHeader>
            <SheetBody className="overflow-y-auto py-2">
              {renderFilterOptions(openFilter as FilterKey)}
            </SheetBody>
            <SheetFooter>
              <button
                onClick={() => setOpenFilter(null)}
                className="w-full bg-[#030213] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#030213]/90 active:bg-[#030213]/80 transition-colors"
              >
                Apply
              </button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile bottom sheet for sort */}
      {!isDesktop && openFilter === "sort" && (
        <Sheet open={true} onOpenChange={(open) => { if (!open) setOpenFilter(null); }}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader onClose={() => setOpenFilter(null)}>
              <SheetTitle>Sort by</SheetTitle>
            </SheetHeader>
            <SheetBody className="py-2">
              {renderSortOptions()}
            </SheetBody>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

/**
 * Convert the activeFilters record + sort into the SearchFilters shape
 * expected by the search service.
 */
export function buildSearchFiltersFromState(
  activeFilters: Record<string, string[]>,
  activeSort: string
): SearchFiltersType {
  const result: SearchFiltersType = {};

  // For multi-select filters, take the first value (API expects single string)
  // or join them — depending on backend support. We send the first selected value.
  if (activeFilters.category?.length) result.category = activeFilters.category.join(',');
  if (activeFilters.color?.length) result.color = activeFilters.color.join(',');
  if (activeFilters.vibe?.length) result.vibe = activeFilters.vibe.join(',');
  if (activeFilters.occasion?.length) result.occasion = activeFilters.occasion.join(',');

  // Parse price range (format: "min-max" or "min-")
  if (activeFilters.price?.length) {
    const priceRange = activeFilters.price[0]; // use first selected price range
    const [min, max] = priceRange.split('-');
    if (min) result.price_min = parseInt(min, 10);
    if (max) result.price_max = parseInt(max, 10);
  }

  // Sort
  if (activeSort && activeSort !== "relevance") {
    result.sort = activeSort;
  }

  return result;
}
