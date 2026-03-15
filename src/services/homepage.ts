import api from './api';

export interface Product {
    productId: string;
    name: string;
    url: string;
    productImageUrl: string;
    imageList: string[];
    brand?: {
        brandId: string;
        name: string;
        url: string;
    };
    tags: {
        featured?: boolean;
        occasion?: string[];
        vibe?: string[];
        collection?: string;
        [key: string]: any;
    };
    price: number;
    metadata: any;
}

export interface HomepageData {
    featuredProducts: Product[];
    scenes: string[];
    vibes: string[];
    collections: {
        id: string;
        name: string;
        items: Product[];
    }[];
}

export interface HomepageStructure {
    featuredProductIds: string[];
    scenes: string[];
    vibes: string[];
    collections: {
        id: string;
        name: string;
        productCount: number;
    }[];
}

export interface FilteredProductsResponse {
    products: Product[];
    total: number;
    hasMore: boolean;
}

let structureCache: { data: HomepageStructure; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchHomepageStructure = async (): Promise<HomepageStructure> => {
    try {
        // Check cache
        if (structureCache && (Date.now() - structureCache.timestamp < CACHE_DURATION)) {
            return structureCache.data;
        }

        const response = await api.get('/api/homepage/structure/');

        // Update cache
        structureCache = {
            data: response.data,
            timestamp: Date.now()
        };

        return response.data;
    } catch (error) {
        console.error('Error fetching homepage structure:', error);
        return {
            featuredProductIds: [],
            scenes: [],
            vibes: [],
            collections: []
        };
    }
};

export const fetchFilteredProducts = async (
    type: 'scene' | 'vibe' | 'collection',
    value: string,
    limit: number = 20,
    offset: number = 0
): Promise<FilteredProductsResponse> => {
    try {
        const response = await api.get('/api/products/filtered/', {
            params: { type, value, limit, offset }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching filtered products:', error);
        return {
            products: [],
            total: 0,
            hasMore: false
        };
    }
};

export const fetchHomepageData = async (): Promise<HomepageData> => {
    try {
        const response = await api.get('/api/homepage/');
        return response.data;
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        return {
            featuredProducts: [],
            scenes: [],
            vibes: [],
            collections: []
        };
    }
};

export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const response = await api.get('/api/products/');
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const fetchScenes = async (products: Product[]): Promise<string[]> => {
    const sceneCounts: Record<string, number> = {};

    products.forEach(product => {
        if (product.tags?.occasion && Array.isArray(product.tags.occasion) && product.tags.occasion.length > 0) {
            // Pick first in array as requested
            const scene = product.tags.occasion[0];
            sceneCounts[scene] = (sceneCounts[scene] || 0) + 1;
        }
    });

    // Sort by count descending and take top 3
    return Object.entries(sceneCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([scene]) => scene);
};

export const fetchVibes = async (products: Product[]): Promise<string[]> => {
    const vibeCounts: Record<string, number> = {};

    products.forEach(product => {
        if (product.tags?.vibe && Array.isArray(product.tags.vibe) && product.tags.vibe.length > 0) {
            // Pick first in array as requested
            const vibe = product.tags.vibe[0];
            vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
        }
    });

    // Sort by count descending and take top 3
    return Object.entries(vibeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([vibe]) => vibe);
};

export const fetchCollections = async (products: Product[]) => {
    const collections: Record<string, Product[]> = {};

    products.forEach(product => {
        const collectionName = product.tags?.collection;
        if (collectionName) {
            if (!collections[collectionName]) {
                collections[collectionName] = [];
            }
            collections[collectionName].push(product);
        }
    });

    // Return top 4 collections with at least 1 product
    return Object.entries(collections)
        .filter(([, items]) => items.length > 0)
        .slice(0, 4)
        .map(([name, items]) => ({
            id: name,
            name: name,
            items: items.slice(0, 4) // Take first 4 items for grid
        }));
};
