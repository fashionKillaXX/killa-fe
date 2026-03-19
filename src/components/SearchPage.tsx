"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { TextInput } from "@/components/shared/TextInput";
import { ProductCatalog } from "@/components/ProductCatalog";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SearchFilters, buildSearchFiltersFromState } from "@/components/SearchFilters";
import { fetchSearchHistory, addSearchHistory, deleteSearchHistory, type SearchFilters as SearchFiltersType } from "@/services/search";
import { useAuth } from "@/contexts/AuthContext";

/**
 * SearchPage with search input, filter chips, recent search history, and inline search results.
 * Uses ProductCatalog in embedded mode (hideHeader) to display search results.
 */
export function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  // Filter and sort state — persists across query changes
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [activeSort, setActiveSort] = useState("relevance");

  // Computed search filters object for the API
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({});

  useEffect(() => {
    loadHistory();
    const savedState = sessionStorage.getItem('searchState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setSearchQuery(parsed.query || "");
      setShowResults(parsed.showResults || false);
      setCurrentQuery(parsed.currentQuery || "");
      // Restore persisted filters
      if (parsed.activeFilters) setActiveFilters(parsed.activeFilters);
      if (parsed.activeSort) setActiveSort(parsed.activeSort);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state to session storage
  useEffect(() => {
    if (searchQuery || showResults || Object.keys(activeFilters).length > 0) {
      sessionStorage.setItem('searchState', JSON.stringify({
        query: searchQuery,
        showResults,
        currentQuery,
        activeFilters,
        activeSort,
      }));
    }
  }, [searchQuery, showResults, currentQuery, activeFilters, activeSort]);

  // Rebuild searchFilters whenever activeFilters or activeSort changes
  useEffect(() => {
    setSearchFilters(buildSearchFiltersFromState(activeFilters, activeSort));
  }, [activeFilters, activeSort]);

  const loadHistory = async () => {
    if (!isAuthenticated) {
      setRecentSearches([]);
      return;
    }
    const history = await fetchSearchHistory();
    setRecentSearches(history);
  };

  const handleSearch = (query: string) => setSearchQuery(query);

  const handleSearchSubmit = async (query: string) => {
    if (query.trim()) {
      const trimmedQuery = query.trim();
      setCurrentQuery(trimmedQuery);
      setShowResults(true);
      if (isAuthenticated) {
        await addSearchHistory(trimmedQuery);
        loadHistory();
      }
    }
  };

  const clearSearch = () => setSearchQuery("");

  const handleRecentClick = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
    handleSearchSubmit(term);
  };

  const removeRecentSearch = async (index: number) => {
    const queryToRemove = recentSearches[index];
    setRecentSearches(recentSearches.filter((_, i) => i !== index));
    await deleteSearchHistory(queryToRemove);
    loadHistory();
  };

  const handleHeaderBack = () => {
    if (showResults) {
      setShowResults(false);
      setSearchQuery("");
      setCurrentQuery("");
      sessionStorage.setItem('searchState', JSON.stringify({
        query: "",
        showResults: false,
        currentQuery: "",
        activeFilters,
        activeSort,
      }));
    } else {
      router.push("/");
    }
  };

  const handleFiltersChange = useCallback((filters: Record<string, string[]>) => {
    setActiveFilters(filters);
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setActiveSort(sort);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md md:max-w-7xl mx-auto">
      {/* Desktop nav */}
      <DesktopNav />

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-12">
        {showResults && (
          <SubpageHeader
            onBackClick={handleHeaderBack}
            showDivider={false}
          />
        )}

        {/* Page Heading */}
        <div className="px-6 pt-12 md:pt-8 md:max-w-2xl md:mx-auto lg:max-w-3xl">
          <h1 style={{ fontSize: '28px' }}>Discover</h1>
        </div>

        {/* Search Section */}
        <div className="px-6 pt-6 md:max-w-2xl md:mx-auto lg:max-w-3xl">
          <div className="relative mb-4">
            <div className="relative">
              <TextInput
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
                placeholder="Search for products, styles..."
                className="px-12 py-4"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 active:text-black hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter chips — always visible as a discovery mechanism */}
          <div className="mb-6">
            <SearchFilters
              activeFilters={activeFilters}
              activeSort={activeSort}
              onFiltersChange={handleFiltersChange}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        {/* Search Results or Recent Searches */}
        {showResults ? (
          <div className="flex-1 h-full">
            <ProductCatalog
              activeFilter={{ type: 'search', value: currentQuery, label: currentQuery }}
              hideHeader={true}
              searchFilters={searchFilters}
            />
          </div>
        ) : (
          <>
            {recentSearches.length > 0 && (
              <div className="px-6 mt-4 md:max-w-2xl md:mx-auto lg:max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm text-gray-500">Recent Searches</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 active:border-gray-300 hover:border-gray-400 hover:shadow-sm transition-all rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)]"
                    >
                      <button
                        onClick={() => handleRecentClick(search)}
                        className="text-sm text-gray-700"
                      >
                        {search}
                      </button>
                      <button
                        onClick={() => removeRecentSearch(index)}
                        className="transition-opacity"
                      >
                        <X className="w-3 h-3 text-gray-400 active:text-gray-700 hover:text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
