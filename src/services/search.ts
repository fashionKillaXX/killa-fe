import api from './api';

export interface SearchResult {
    product_id: string;
    name: string;
    product_image_url: string;
    distance: number;
    similarity_score: number;
    search_type: string;
    rrf_score?: number;
}

export interface SearchResponse {
    success: boolean;
    query: string;
    count: number;
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
    results: SearchResult[];
}

export interface SearchHistoryResponse {
    success: boolean;
    searches: string[];
}

/** Filter parameters accepted by the search API */
export interface SearchFilters {
    category?: string;
    subcategory?: string;
    color?: string;
    vibe?: string;
    occasion?: string;
    price_min?: number;
    price_max?: number;
    brand_id?: string;
    sort?: string;
}

/** A single filter option returned by the filters endpoint */
export interface FilterOption {
    value: string;
    label: string;
    count: number;
}

/** Response shape from GET /fashion/api/search/filters/ */
export interface SearchFiltersResponse {
    success: boolean;
    categories: FilterOption[];
    subcategories: FilterOption[];
    colors: FilterOption[];
    vibes: FilterOption[];
    occasions: FilterOption[];
}

// In-memory cache for search results (Map<query, response>)
const searchCache = new Map<string, SearchResponse>();
const CACHE_LIMIT = 20;

/**
 * Build a stable cache key from query, pagination, and filter params.
 */
const buildCacheKey = (query: string, offset: number, limit: number, filters?: SearchFilters): string => {
    const filterStr = filters ? JSON.stringify(filters, Object.keys(filters).sort()) : '';
    return `${query}:${offset}:${limit}:${filterStr}`;
};

/**
 * Perform AI-powered search with pagination and filter support.
 * Sends a POST request with query, limit, offset, and optional filters in the body.
 */
export const searchAI = async (
    query: string,
    limit: number = 20,
    offset: number = 0,
    filters?: SearchFilters
): Promise<SearchResponse> => {
    try {
        const cacheKey = buildCacheKey(query, offset, limit, filters);

        // Check cache first
        if (searchCache.has(cacheKey)) {
            console.log('[SearchService] Returning cached result for:', cacheKey);
            return searchCache.get(cacheKey)!;
        }

        // Build POST body with query, pagination, and filters
        const body: Record<string, unknown> = {
            query,
            limit,
            offset,
        };

        // Merge filter params into the body (only non-empty values)
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    body[key] = value;
                }
            });
        }

        const response = await api.post('/api/search-ai/', body);

        // Update cache
        if (response.data.success) {
            // Manage cache size
            if (searchCache.size >= CACHE_LIMIT) {
                const firstKey = searchCache.keys().next().value;
                if (firstKey) searchCache.delete(firstKey);
            }
            searchCache.set(cacheKey, response.data);
        }

        return response.data;
    } catch (error) {
        console.error('Error performing AI search:', error);
        return {
            success: false,
            query,
            count: 0,
            total: 0,
            offset: 0,
            limit,
            hasMore: false,
            results: []
        };
    }
};

export const clearSearchCache = () => {
    searchCache.clear();
};

// Cache for filter options
let filtersCache: { data: SearchFiltersResponse; timestamp: number } | null = null;
const FILTERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch available filter values with counts from the backend.
 * Results are cached for 5 minutes.
 */
export const fetchSearchFilters = async (): Promise<SearchFiltersResponse> => {
    try {
        // Check cache
        if (filtersCache && (Date.now() - filtersCache.timestamp < FILTERS_CACHE_DURATION)) {
            return filtersCache.data;
        }

        const response = await api.get('/api/search/filters/');

        if (response.data.success) {
            filtersCache = {
                data: response.data,
                timestamp: Date.now()
            };
            return response.data;
        }

        return { success: false, categories: [], subcategories: [], colors: [], vibes: [], occasions: [] };
    } catch (error) {
        console.error('Error fetching search filters:', error);
        return { success: false, categories: [], subcategories: [], colors: [], vibes: [], occasions: [] };
    }
};

/**
 * Get recent search history
 */
let historyCache: { data: string[]; timestamp: number } | null = null;
const HISTORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get recent search history
 */
export const fetchSearchHistory = async (): Promise<string[]> => {
    try {
        // Check cache
        if (historyCache && (Date.now() - historyCache.timestamp < HISTORY_CACHE_DURATION)) {
            return historyCache.data;
        }

        const response = await api.get('/api/search/history/');
        if (response.data.success) {
            // Update cache
            historyCache = {
                data: response.data.searches,
                timestamp: Date.now()
            };
            return response.data.searches;
        }
        return [];
    } catch (error) {
        console.error('Error fetching search history:', error);
        return [];
    }
};

/**
 * Add or update a search query in history
 */
export const addSearchHistory = async (query: string): Promise<boolean> => {
    try {
        const response = await api.post('/api/search/history/add/', { query });
        if (response.data.success) {
            // Invalidate cache so next fetch gets fresh data
            historyCache = null;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding search history:', error);
        return false;
    }
};

/**
 * Delete a search query from history
 */
export const deleteSearchHistory = async (query: string): Promise<boolean> => {
    try {
        const response = await api.delete('/api/search/history/delete/', {
            data: { query }
        });
        if (response.data.success) {
            // Invalidate cache
            historyCache = null;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting search history:', error);
        return false;
    }
};
