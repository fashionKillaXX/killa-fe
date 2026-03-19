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

// In-memory cache for search results (Map<query, response>)
const searchCache = new Map<string, SearchResponse>();
const CACHE_LIMIT = 20;

/**
 * Perform AI-powered search with pagination support
 */
export const searchAI = async (query: string, limit: number = 20, offset: number = 0): Promise<SearchResponse> => {
    try {
        const cacheKey = `${query}:${offset}:${limit}`;

        // Check cache first
        if (searchCache.has(cacheKey)) {
            console.log('[SearchService] Returning cached result for:', cacheKey);
            return searchCache.get(cacheKey)!;
        }

        const response = await api.get(`/api/search-ai/?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);

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
