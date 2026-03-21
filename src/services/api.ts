import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: BACKEND_URL + '/fashion',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle expired/invalid tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is expired or invalid — clear auth state
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Dispatch a custom event so AuthContext can react
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth:logout'));
            }
        }
        return Promise.reject(error);
    }
);

export interface TagPreviewItem {
  productId: string;
  name: string;
  productImageUrl: string;
  brand: string;
}

export interface TagPreviewsResponse {
  occasion: TagPreviewItem[];
  vibe: TagPreviewItem[];
  fit: TagPreviewItem[];
  season: TagPreviewItem[];
}

export async function fetchTagPreviews(limit = 20): Promise<TagPreviewsResponse> {
  const res = await api.get<TagPreviewsResponse>(`/api/products/tag-previews/?limit=${limit}`);
  return res.data;
}

export default api;
