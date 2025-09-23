// API service functions for the customer survey
import { getStoredToken } from './auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface Product {
  id: string;
  name: string;
  url: string;
  image_url: string;
  image_list: string[];
  brand: {
    id: string;
    name: string;
    url: string;
  };
  tags: Record<string, any>;
  metadata: {
    price: string;
    sku_id: string;
    collection: string;
    availability: string;
    extracted_at: string;
    variant_title: string;
  };
}

export interface FeedbackData {
  product_id: string;
  price: number | null;
  rating_without_price: number | null;
  rating_with_price: number | null;
}

export interface BackendFeedbackRequest {
  product_id: string;
  feedback_type: FeedbackType;
  feedback_basis_price_type: FeedbackType;
  notes: string;
}

// Valid feedback types as per backend
export type FeedbackType = 'lowest' | 'low' | 'medium' | 'high' | 'highest' | 'skip' | 'save';

// Map numeric ratings to feedback types
export function mapRatingToFeedbackType(rating: number | null): FeedbackType {
  if (rating === null) return 'skip';
  
  if (rating <= 1) return 'lowest';
  if (rating <= 2) return 'low';
  if (rating <= 3) return 'medium';
  if (rating <= 4) return 'high';
  return 'highest';
}

// Create authenticated headers
function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Mock data for testing - 15 diverse high-quality fashion images
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Classic Fashion Item",
    url: "https://example.com/product/1",
    image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    image_list: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center&auto=format&q=80"],
    brand: {
      id: "brand-1",
      name: "Mock Brand",
      url: "https://example.com/brand/1"
    },
    tags: {},
    metadata: {
      price: "2500",
      sku_id: "mock-1",
      collection: "mock-collection",
      availability: "in-stock",
      extracted_at: new Date().toISOString(),
      variant_title: ""
    }
  }
];

// Fetch products from API
export async function fetchProducts(): Promise<Product[]> {
  try {
    console.log('Fetching products from:', `${BACKEND_URL}/fashion/api/products/batch/`);
    const headers = getAuthHeaders();
    console.log('Using headers:', headers);
    
    const response = await fetch(
      `${BACKEND_URL}/fashion/api/products/batch/`,
      {
        headers,
      }
    );
    
    console.log('Products response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Products fetch error:', errorText);
      throw new Error(`Failed to fetch products: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Products API response:', data);
    
    // Handle backend response format: { success: true, products: [...] }
    const products = data.products || data;
    console.log('Products received:', products.length || 0, 'items');
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    // Fallback to mock data
    console.log('Using mock data as fallback');
    return mockProducts;
  }
}

// Post feedback to API
export async function postFeedback(feedback: FeedbackData): Promise<boolean> {
  console.log("Posting feedback:", feedback);
  try {
    // Transform to backend format
    const backendRequest: BackendFeedbackRequest = {
      product_id: feedback.product_id,
      feedback_type: mapRatingToFeedbackType(feedback.rating_without_price),
      feedback_basis_price_type: mapRatingToFeedbackType(feedback.rating_with_price),
      notes: ''
    };

    console.log("Sending to backend:", backendRequest);

    const response = await fetch(
      `${BACKEND_URL}/fashion/api/feedback/`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(backendRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Feedback submission error:', errorText);
      throw new Error(`Failed to post feedback: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("Feedback submission success:", result);
    return true;
  } catch (error) {
    console.error("Error posting feedback:", error);
    return false;
  }
}

// Post batch feedback to API
export async function postBatchFeedback(feedbackList: FeedbackData[]): Promise<boolean> {
  console.log("Posting batch feedback:", feedbackList);
  try {
    // Transform all feedback data to backend format
    const backendRequests = feedbackList.map(feedback => ({
      product_id: feedback.product_id,
      feedback_type: mapRatingToFeedbackType(feedback.rating_without_price),
      feedback_basis_price_type: mapRatingToFeedbackType(feedback.rating_with_price),
      notes: ''
    }));

    const response = await fetch(
      `${BACKEND_URL}/fashion/api/feedback/batch/`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ feedback_list: backendRequests }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Batch feedback submission error:', errorText);
      throw new Error(`Failed to post batch feedback: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("Batch feedback submission success:", result);
    return true;
  } catch (error) {
    console.error("Error posting batch feedback:", error);
    return false;
  }
}
