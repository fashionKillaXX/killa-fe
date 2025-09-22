// API service functions for the customer survey

export interface Product {
  id: string;
  image_url: string;
  price: number;
}

export interface FeedbackData {
  product_id: string;
  price: number;
  rating_without_price: number | null;
  rating_with_price: number | null;
}

// Mock data for testing - 15 diverse high-quality fashion images
export const mockProducts: Product[] = [
  {
    id: "1",
    image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 2500,
  },
  {
    id: "2", 
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 3200,
  },
  {
    id: "3",
    image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop&crop=center&auto=format&q=80", 
    price: 1800,
  },
  {
    id: "4",
    image_url: "https://images.unsplash.com/photo-1529720317453-c8da503f2051?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 4500,
  },
  {
    id: "5",
    image_url: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 3800,
  },
  {
    id: "6",
    image_url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 2200,
  },
  {
    id: "7",
    image_url: "https://images.unsplash.com/photo-1508001756192-6bc13eb8c735?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 5200,
  },
  {
    id: "8",
    image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 2800,
  },
  {
    id: "9",
    image_url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 3500,
  },
  {
    id: "10",
    image_url: "https://images.unsplash.com/photo-1506629905607-bb5200e2329b?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 4200,
  },
  {
    id: "11",
    image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 1950,
  },
  {
    id: "12",
    image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 3100,
  },
  {
    id: "13",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 2750,
  },
  {
    id: "14",
    image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 4800,
  },
  {
    id: "15",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop&crop=center&auto=format&q=80",
    price: 3650,
  },
];

// Fetch products from API
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/fashion/api/products/batch/"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    // Fallback to mock data
    return mockProducts;
  }
}

// Post feedback to API
export async function postFeedback(feedback: FeedbackData): Promise<boolean> {
  console.log("Posting feedback:", feedback);
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/fashion/api/feedback/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to post feedback");
    }

    return true;
  } catch (error) {
    console.error("Error posting feedback:", error);
    return false;
  }
}
