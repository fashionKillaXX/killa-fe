/**
 * Service for managing user style preferences
 * Includes caching layer to reduce API calls
 */

import api from './api';

export interface Brand {
    id: string;
    name: string;
}

export interface StylePreferences {
    gender: string;
    age: number;
    body_type: string;
    brands: Brand[];
    accessory_preferences: string[];
}

export interface PreferencesResponse {
    success: boolean;
    preferences: StylePreferences | null;
    error?: string;
}

export interface UpdatePreferenceResponse {
    success: boolean;
    field: string;
    value: any;
    message?: string;
    error?: string;
}

// ============ CACHING LAYER ============
interface CacheEntry {
    data: PreferencesResponse;
    timestamp: number;
}

let preferencesCache: CacheEntry | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Invalidate preferences cache
 * Call this on logout or when you need fresh data
 */
export const invalidatePreferencesCache = () => {
    console.log('[PreferencesService] Cache invalidated');
    preferencesCache = null;
};

/**
 * Update a specific field in the cache without refetching
 */
const updateCacheField = (field: string, value: any) => {
    if (preferencesCache?.data.preferences) {
        const prefs = preferencesCache.data.preferences;
        switch (field) {
            case 'gender':
                prefs.gender = value;
                break;
            case 'age':
                prefs.age = value;
                break;
            case 'body_type':
                prefs.body_type = value;
                break;
            case 'brands':
                prefs.brands = value;
                break;
            case 'accessory_preferences':
                prefs.accessory_preferences = value;
                break;
        }
        console.log('[PreferencesService] Cache updated for field:', field);
    }
};

/**
 * Fetch user's current style preferences
 * Uses cache if available and not expired
 */
export const fetchUserPreferences = async (forceRefresh = false): Promise<PreferencesResponse> => {
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh && preferencesCache && (now - preferencesCache.timestamp < CACHE_DURATION)) {
        console.log('[PreferencesService] Returning cached preferences');
        return preferencesCache.data;
    }

    try {
        const response = await api.get('/api/user/preferences/');

        // Update cache on success
        if (response.data.success) {
            preferencesCache = {
                data: response.data,
                timestamp: now
            };
            console.log('[PreferencesService] Preferences cached');
        }

        return response.data;
    } catch (error: any) {
        console.error('Error fetching preferences:', error);
        return {
            success: false,
            preferences: null,
            error: error.response?.data?.error || 'Failed to fetch preferences'
        };
    }
};

// ============ BRANDS CACHING ============
interface BrandsCacheEntry {
    data: Brand[];
    timestamp: number;
}

let brandsCache: BrandsCacheEntry | null = null;
const BRANDS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (brands rarely change)

/**
 * Fetch available brands for selection
 * Uses cache since brands rarely change
 */
export const fetchAvailableBrands = async (): Promise<{ success: boolean; brands: Brand[]; error?: string }> => {
    const now = Date.now();

    // Check cache first
    if (brandsCache && (now - brandsCache.timestamp < BRANDS_CACHE_DURATION)) {
        console.log('[PreferencesService] Returning cached brands');
        return { success: true, brands: brandsCache.data };
    }

    try {
        const response = await api.get('/api/onboarding/brands/');

        if (response.data.success) {
            brandsCache = {
                data: response.data.brands,
                timestamp: now
            };
            console.log('[PreferencesService] Brands cached');
        }

        return response.data;
    } catch (error: any) {
        console.error('Error fetching brands:', error);
        return {
            success: false,
            brands: [],
            error: error.response?.data?.error || 'Failed to fetch brands'
        };
    }
};

/**
 * Update a specific preference field
 * Updates cache on success
 */
export const updatePreference = async (
    field: string,
    value: any
): Promise<UpdatePreferenceResponse> => {
    try {
        const response = await api.put('/api/user/preferences/update/', {
            field,
            value
        });

        // Update cache on success
        if (response.data.success) {
            // For gender changes, the backend may have filtered accessories
            // So we need to refetch to get the updated state
            if (field === 'gender') {
                // Invalidate cache so next fetch gets fresh data
                invalidatePreferencesCache();
            } else {
                // For other fields, update cache directly
                updateCacheField(field, response.data.value);
            }
        }

        return response.data;
    } catch (error: any) {
        console.error('Error updating preference:', error);
        return {
            success: false,
            field,
            value,
            error: error.response?.data?.error || 'Failed to update preference'
        };
    }
};
