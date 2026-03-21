"use client";

import { useState, useEffect } from "react";
import { Search, X, Clock } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { TextInput } from "@/components/shared/TextInput";
import { ProductCatalog } from "@/components/ProductCatalog";
import { SubpageHeader } from "@/components/SubpageHeader";
import { fetchSearchHistory, addSearchHistory, deleteSearchHistory } from "@/services/search";
import { useAuth } from "@/contexts/AuthContext";

export function SearchPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    loadHistory();
    const savedState = sessionStorage.getItem("searchState");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setSearchQuery(parsed.query || "");
      setShowResults(parsed.showResults || false);
      setCurrentQuery(parsed.currentQuery || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery || showResults) {
      sessionStorage.setItem("searchState", JSON.stringify({
        query: searchQuery,
        showResults,
        currentQuery,
      }));
    }
  }, [searchQuery, showResults, currentQuery]);

  const loadHistory = async () => {
    if (!isAuthenticated) { setRecentSearches([]); return; }
    const history = await fetchSearchHistory();
    setRecentSearches(history);
  };

  const handleSearchSubmit = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setCurrentQuery(q);
    setShowResults(true);
    if (isAuthenticated) {
      await addSearchHistory(q);
      loadHistory();
    }
  };

  const handleRecentClick = (term: string) => {
    setSearchQuery(term);
    handleSearchSubmit(term);
  };

  const removeRecentSearch = async (index: number) => {
    const queryToRemove = recentSearches[index];
    setRecentSearches(recentSearches.filter((_, i) => i !== index));
    await deleteSearchHistory(queryToRemove);
    loadHistory();
  };

  const handleBack = () => {
    setShowResults(false);
    setSearchQuery("");
    setCurrentQuery("");
    sessionStorage.removeItem("searchState");
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md md:max-w-7xl mx-auto">
      <DesktopNav />

      <div className="flex-1 flex flex-col overflow-y-auto pb-24 md:pb-12">

        {showResults && (
          <SubpageHeader onBackClick={handleBack} showDivider={false} />
        )}

        {!showResults && (
          <div className="px-6 pt-12 pb-6 md:pt-10 md:max-w-2xl md:mx-auto lg:max-w-3xl w-full">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1">Fitcurry</p>
            <h1 className="text-3xl md:text-4xl" style={{ letterSpacing: "-0.02em" }}>Search</h1>
          </div>
        )}

        {/* Search input */}
        <div className="px-6 pt-4 md:max-w-2xl md:mx-auto lg:max-w-3xl w-full">
          <div className="relative">
            <TextInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
              placeholder="Search for products, styles..."
              className="px-12 py-4"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black active:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {showResults ? (
          <div className="flex-1 mt-4">
            <ProductCatalog
              activeFilter={{ type: "search", value: currentQuery, label: currentQuery }}
              hideHeader={true}
            />
          </div>
        ) : (
          /* Recent searches only */
          <div className="px-6 mt-6 md:max-w-2xl md:mx-auto lg:max-w-3xl w-full">
            {recentSearches.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Recent</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-[6px] pl-3 pr-2 py-1.5 hover:border-gray-400 transition-colors"
                    >
                      <button
                        onClick={() => handleRecentClick(search)}
                        className="text-xs text-gray-700 whitespace-nowrap"
                      >
                        {search}
                      </button>
                      <button
                        onClick={() => removeRecentSearch(index)}
                        className="flex-shrink-0"
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3 text-gray-300 hover:text-gray-600 transition-colors" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
