import api from './api';

// ============ CACHING LAYER ============
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache for featured products (homepage)
let featuredProductsCache: CacheEntry<ProductsResponse> | null = null;
const FEATURED_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for user collection products (Map<collectionId, response>)
const collectionProductsCache = new Map<string, CacheEntry<ProductsResponse>>();
const COLLECTION_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
const COLLECTION_CACHE_LIMIT = 10; // Max number of collections to cache

/**
 * Generate a cache key from filters
 */
const generateCacheKey = (filters: ProductsFilter): string => {
  return JSON.stringify(filters);
};

/**
 * Invalidate collection cache when items are added/removed
 */
export const invalidateCollectionCache = (collectionId?: string) => {
  if (collectionId) {
    // Invalidate specific collection
    for (const [key] of collectionProductsCache) {
      if (key.includes(collectionId)) {
        collectionProductsCache.delete(key);
      }
    }
  } else {
    // Invalidate all collection caches
    collectionProductsCache.clear();
  }
};

/**
 * Invalidate featured products cache
 */
export const invalidateFeaturedCache = () => {
  featuredProductsCache = null;
};

export interface Product {
  productId: string;
  name: string;
  url: string;
  productImageUrl: string;
  imageList: string[];
  description?: string;
  brand?: {
    brandId: string;
    name: string;
    url?: string;
    brandLogo?: string;
    brandInstagram?: string;
  } | null;
  tags: {
    featured?: boolean;
    occasion?: string[];
    vibe?: string[];
    collection?: string;
    [key: string]: any;
  };
  price: number;
  metadata: any;
  savedCollectionIds: string[];  // Collection IDs this product is saved in
  isSaved: boolean;              // Convenience boolean (true if savedCollectionIds.length > 0)
  created_at: string;
}

export interface ProductsFilter {
  featured?: boolean;
  scene?: string;
  vibe?: string;
  collection?: string;
  userCollectionId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export interface CollectionWithState {
  collectionId: string;
  name: string;
  isSaved: boolean;
}

export interface ProductCollectionsStateResponse {
  success: boolean;
  productId: string;
  collections: CollectionWithState[];
}

/**
 * Unified products API - fetches products with flexible filtering
 * Includes caching for featured products and user collections
 */
export const fetchProductsUnified = async (filters: ProductsFilter = {}): Promise<ProductsResponse> => {
  try {
    const now = Date.now();

    // Check cache for featured products (homepage)
    if (filters.featured && !filters.offset) {
      if (featuredProductsCache && (now - featuredProductsCache.timestamp < FEATURED_CACHE_DURATION)) {
        console.log('[ProductsService] Returning cached featured products');
        return featuredProductsCache.data;
      }
    }

    // Check cache for user collection products
    if (filters.userCollectionId && !filters.offset) {
      const cacheKey = generateCacheKey(filters);
      const cached = collectionProductsCache.get(cacheKey);
      if (cached && (now - cached.timestamp < COLLECTION_CACHE_DURATION)) {
        console.log('[ProductsService] Returning cached collection products:', filters.userCollectionId);
        return cached.data;
      }
    }

    const params = new URLSearchParams();

    if (filters.featured) params.append('featured', 'true');
    if (filters.scene) params.append('scene', filters.scene);
    if (filters.vibe) params.append('vibe', filters.vibe);
    if (filters.collection) params.append('collection', filters.collection);
    if (filters.userCollectionId) params.append('user_collection_id', filters.userCollectionId);
    if (filters.brandId) params.append('brand_id', filters.brandId);
    if (filters.minPrice !== undefined) params.append('min_price', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('max_price', filters.maxPrice.toString());
    params.append('limit', (filters.limit || 10).toString());
    params.append('offset', (filters.offset || 0).toString());
    if (filters.sort) params.append('sort', filters.sort);

    const response = await api.get(`/api/products/unified/?${params.toString()}`);
    const data = response.data;

    // Cache featured products response
    if (filters.featured && !filters.offset && data.success) {
      console.log('[ProductsService] Caching featured products');
      featuredProductsCache = { data, timestamp: now };
    }

    // Cache user collection products response
    if (filters.userCollectionId && !filters.offset && data.success) {
      const cacheKey = generateCacheKey(filters);
      // Manage cache size
      if (collectionProductsCache.size >= COLLECTION_CACHE_LIMIT) {
        const firstKey = collectionProductsCache.keys().next().value;
        if (firstKey) collectionProductsCache.delete(firstKey);
      }
      console.log('[ProductsService] Caching collection products:', filters.userCollectionId);
      collectionProductsCache.set(cacheKey, { data, timestamp: now });
    }

    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      products: [],
      total: 0,
      hasMore: false,
      limit: filters.limit || 10,
      offset: filters.offset || 0
    };
  }
};

/**
 * Get all user collections with saved state for a specific product
 */
export const getProductCollectionsState = async (productId: string): Promise<ProductCollectionsStateResponse> => {
  try {
    const response = await api.get(`/api/products/${productId}/collections/state/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product collections state:', error);
    return {
      success: false,
      productId,
      collections: []
    };
  }
};

/**
 * Batch update product collections (add/remove)
 */
export const batchUpdateProductCollections = async (
  productId: string,
  add: string[],
  remove: string[]
): Promise<{ success: boolean; added: number; removed: number; errors?: string[] }> => {
  try {
    const response = await api.post(`/api/products/${productId}/collections/batch/`, {
      add,
      remove
    });

    // Invalidate cache for affected collections
    if (response.data.success) {
      [...add, ...remove].forEach(collectionId => {
        invalidateCollectionCache(collectionId);
      });
    }

    return response.data;
  } catch (error: any) {
    console.error('Error batch updating collections:', error);
    return {
      success: false,
      added: 0,
      removed: 0,
      errors: [error.response?.data?.error || 'Failed to update collections']
    };
  }
};


/**
 * Product Detail Interface
 */
export interface ProductDetail {
  productId: string;
  name: string;
  url: string;
  productUrl: string;
  productImageUrl: string;
  imageList: string[];
  description: string;
  tags: any;
  price: number;
  metadata: any;
  brand: {
    brandId: string;
    name: string;
    url: string;
    brandLogo: string;
    brandInstagram: string;
  } | null;
  savedCollectionIds: string[];  // Collection IDs this product is saved in
  isSaved: boolean;
  created_at: string;
}

/**
 * Fetch single product details
 */
export const fetchProductDetail = async (productId: string): Promise<{ success: boolean; product?: ProductDetail; error?: string }> => {
  try {
    const response = await api.get(`/api/products/${productId}/`);
    return {
      success: true,
      product: response.data
    };
  } catch (error: any) {
    console.error('Error fetching product detail:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch product details'
    };
  }
};
