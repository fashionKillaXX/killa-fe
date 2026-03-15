"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TextInput } from "@/components/shared/TextInput";
import { ProductCatalog } from "@/components/ProductCatalog";
import { SubpageHeader } from "@/components/SubpageHeader";
import { fetchSearchHistory, addSearchHistory, deleteSearchHistory } from "@/services/search";
import { useAuth } from "@/contexts/AuthContext";

/**
 * SearchPage with search input, recent search history, and inline search results.
 * Uses ProductCatalog in embedded mode (hideHeader) to display search results.
 */
export function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    loadHistory();

    // Restore state from session storage if available
    const savedState = sessionStorage.getItem('searchState');
    if (savedState) {
      const { query, showResults: savedShowResults, currentQuery: savedCurrentQuery } = JSON.parse(savedState);
      setSearchQuery(query);
      setShowResults(savedShowResults);
      setCurrentQuery(savedCurrentQuery);
    }
  }, []);

  useEffect(() => {
    // Save state to session storage whenever it changes
    if (searchQuery || showResults) {
      sessionStorage.setItem('searchState', JSON.stringify({
        query: searchQuery,
        showResults,
        currentQuery
      }));
    }
  }, [searchQuery, showResults, currentQuery]);

  const loadHistory = async () => {
    // Only fetch history if user is authenticated
    if (!isAuthenticated) {
      setRecentSearches([]);
      return;
    }
    const history = await fetchSearchHistory();
    setRecentSearches(history);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = async (query: string) => {
    if (query.trim()) {
      const trimmedQuery = query.trim();
      setCurrentQuery(trimmedQuery);
      setShowResults(true);

      // Add to history only if authenticated
      if (isAuthenticated) {
        await addSearchHistory(trimmedQuery);
        loadHistory(); // Refresh history
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    // Do NOT close results or clear session storage
    // User wants to just clear the input to type a new query
  };

  const handleRecentClick = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
    handleSearchSubmit(term);
  };

  const removeRecentSearch = async (index: number) => {
    const queryToRemove = recentSearches[index];
    // Optimistic update
    setRecentSearches(recentSearches.filter((_, i) => i !== index));
    await deleteSearchHistory(queryToRemove);
    loadHistory(); // Refresh to be sure
  };

  const handleHeaderBack = () => {
    if (showResults) {
      setShowResults(false);
      setSearchQuery(""); // Clear input
      setCurrentQuery(""); // Clear current query
      // Update session storage to reflect we are back at input with empty query
      sessionStorage.setItem('searchState', JSON.stringify({
        query: "",
        showResults: false,
        currentQuery: ""
      }));
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {showResults && (
          <SubpageHeader
            onBackClick={handleHeaderBack}
            showDivider={false}
          />
        )}

        {/* Page Heading */}
        <div className="px-6 pt-12">
          <h1 style={{ fontSize: '28px' }}>Get cooking</h1>
        </div>

        {/* Search Section */}
        <div className="px-6 pt-6">
          {/* Search Input */}
          <div className="relative mb-8">
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 active:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Results or Recent Searches */}
        {showResults ? (
          <div className="flex-1 h-full">
            <ProductCatalog
              activeFilter={{ type: 'search', value: currentQuery, label: currentQuery }}
              hideHeader={true}
            />
          </div>
        ) : (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="px-6 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm text-gray-500">Recent Searches</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 active:border-gray-300 transition-colors rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)]"
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
                        <X className="w-3 h-3 text-gray-400 active:text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
