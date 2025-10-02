"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, FeedbackData, fetchProducts, fetchNextBatch, postFeedback } from "@/lib/api";

interface SurveyContextType {
  products: Product[];
  currentProductIndex: number;
  currentProduct: Product | null;
  currentFeedback: FeedbackData | null;
  isLoading: boolean;
  isLoadingNextBatch: boolean;
  isSubmitting: boolean;
  showFirstTick: boolean;
  showSecondTick: boolean;
  completedProductIds: string[];
  totalProductsRated: number;
  addFeedback: (rating: number) => void;
  submitFeedback: () => Promise<void>;
  resetSurvey: () => void;
  startNewSurvey: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showFirstTick, setShowFirstTick] = useState(false);
  const [showSecondTick, setShowSecondTick] = useState(false);
  const [completedProductIds, setCompletedProductIds] = useState<string[]>([]);
  const [allSeenProductIds, setAllSeenProductIds] = useState<string[]>([]);
  const [isLoadingNextBatch, setIsLoadingNextBatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const currentProduct = products[currentProductIndex] || null;
  const totalProductsRated = completedProductIds.length;

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const fetchedProducts = await fetchProducts();
        console.log(`Loaded ${fetchedProducts.length} products for survey`);
        setProducts(fetchedProducts);
        // Initialize seen products list with current batch
        const productIds = fetchedProducts.map(p => p.id);
        setAllSeenProductIds(productIds);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Initialize feedback object when product changes
  useEffect(() => {
    if (
      currentProduct &&
      (!currentFeedback || currentFeedback.product_id !== currentProduct.id)
    ) {
      // Extract price from metadata and convert to number, or null if not available
      const priceStr = currentProduct.metadata.price;
      const price =
        priceStr && priceStr.trim() !== "" ? parseInt(priceStr) : null;

      const feedback: FeedbackData = {
        product_id: currentProduct.id,
        price: price,
        rating_without_price: null,
        rating_with_price: null,
      };
      setCurrentFeedback(feedback);
      console.log(
        `Initialized feedback for product ${currentProduct.id}, price: ${price}`
      );
    }
  }, [currentProduct, currentFeedback]);

  const getNextAvailableProduct = (): number => {
    // Find next product that hasn't been completed
    for (let i = 0; i < products.length; i++) {
      const productId = products[i]?.id;
      if (productId && !completedProductIds.includes(productId)) {
        return i;
      }
    }
    // If all products completed, start over (or handle as needed)
    return 0;
  };

  const loadNextBatch = async (): Promise<boolean> => {
    setIsLoadingNextBatch(true);
    try {
      console.log("Loading next batch of products...");
      const nextBatch = await fetchNextBatch(allSeenProductIds);
      
      if (nextBatch.length > 0) {
        console.log(`Loaded ${nextBatch.length} new products`);
        setProducts(nextBatch);
        setCurrentProductIndex(0);
        setCompletedProductIds([]);
        
        // Add new product IDs to seen list
        const newProductIds = nextBatch.map(p => p.id);
        setAllSeenProductIds(prev => [...prev, ...newProductIds]);
        
        return true;
      } else {
        console.log("No more products available from backend");
        return false;
      }
    } catch (error) {
      console.error("Error loading next batch:", error);
      return false;
    } finally {
      setIsLoadingNextBatch(false);
    }
  };

  const moveToNextProduct = async () => {
    console.log("moving to new products")
    // IMPORTANT: Reset state FIRST before changing product
    setCurrentFeedback(null);
    setShowFirstTick(false);
    setShowSecondTick(false);

    
    
    // Find next available product that hasn't been rated
    const availableProducts = products.filter(
      (p) => !completedProductIds.includes(p.id)
    );

    if (availableProducts.length > 0) {
      // Find index of next available product
      const nextIndex = getNextAvailableProduct();
      setCurrentProductIndex(nextIndex+1);
      console.log(
        `Moving to next product: ${products[nextIndex]?.id} (${availableProducts.length} remaining)`
      );
    } else {
      // All products completed, try to load next batch
      console.log("All products completed! Attempting to load next batch...");
      const batchLoaded = await loadNextBatch();
      
      // if (!batchLoaded) {
      //   // No more products available, start over with first batch
      //   console.log("No more batches available, starting over with first product");
      //   setCurrentProductIndex(0);
      //   setCompletedProductIds([]); // Reset completed products
      // }
    }
  };


  const addFeedback = async (rating: number) => {
    // Prevent multiple ratings while processing
    if (isSubmitting) {
      console.log("Ignoring rating - already submitting feedback");
      return;
    }

    if (currentProduct && currentFeedback) {
      const updatedFeedback: FeedbackData = {
        ...currentFeedback,
        rating_without_price: rating,
        rating_with_price: rating,
      };

      console.log("Added rating:", rating);
      console.log("Feedback object:", updatedFeedback);

      // Submit feedback immediately
      await submitFeedbackWithData(updatedFeedback);
    }
  };

  const submitFeedbackWithData = async (feedbackData: FeedbackData) => {
    setIsSubmitting(true);
    
    try {
      console.log("Submitting feedback for product:", feedbackData.product_id);
      
      // WAIT for API to respond before moving
      const success = await postFeedback(feedbackData);

      if (success) {
        console.log("Feedback submitted successfully!");
        
        // Mark product as completed
        if (currentProduct) {
          setCompletedProductIds((prev) => [...prev, currentProduct.id]);
          console.log(`Product ${currentProduct.id} marked as completed`);
        }
        
        // Move to next product ONLY after successful API call
        await moveToNextProduct();
      } else {
        console.error("Failed to submit feedback - NOT moving to next product");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    if (
      currentFeedback &&
      (currentFeedback.rating_without_price !== null ||
        currentFeedback.rating_with_price !== null)
    ) {
      await submitFeedbackWithData(currentFeedback);
    } else {
      console.log("No feedback to submit");
    }
  };


  const resetSurvey = () => {
    setCurrentProductIndex(0);
    setCurrentFeedback(null);
    setShowFirstTick(false);
    setShowSecondTick(false);
    setCompletedProductIds([]);
    console.log("Survey reset - all products available again");
  };

  return (
    <SurveyContext.Provider
      value={{
        products,
        currentProductIndex,
        currentProduct,
        currentFeedback,
        isLoading,
        isLoadingNextBatch,
        isSubmitting,
        showFirstTick,
        showSecondTick,
        completedProductIds,
        totalProductsRated,
        addFeedback,
        submitFeedback,
        resetSurvey,
        startNewSurvey: resetSurvey,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error("useSurvey must be used within a SurveyProvider");
  }
  return context;
}
