"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, FeedbackData, fetchProducts, postFeedback } from "@/lib/api";

interface SurveyContextType {
  products: Product[];
  currentProductIndex: number;
  currentProduct: Product | null;
  currentSurveyStep: number; // 0 = without price, 1 = with price
  currentFeedback: FeedbackData | null;
  isLoading: boolean;
  showSuccess: boolean;
  showFirstTick: boolean;
  showSecondTick: boolean;
  completedProductIds: string[];
  totalProductsRated: number;
  nextProduct: () => void;
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
  const [currentSurveyStep, setCurrentSurveyStep] = useState(0); // 0 = without price, 1 = with price
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFirstTick, setShowFirstTick] = useState(false);
  const [showSecondTick, setShowSecondTick] = useState(false);
  const [completedProductIds, setCompletedProductIds] = useState<string[]>([]);

  // Derived state
  const currentProduct = products[currentProductIndex] || null;
  const isSecondView = currentSurveyStep === 1;
  const totalProductsRated = completedProductIds.length;

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const fetchedProducts = await fetchProducts();
        console.log(`Loaded ${fetchedProducts.length} products for survey`);
        setProducts(fetchedProducts);
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
    if (currentProduct && (!currentFeedback || currentFeedback.product_id !== currentProduct.id)) {
      const feedback: FeedbackData = {
        product_id: currentProduct.id,
        price: currentProduct.price,
        rating_without_price: null,
        rating_with_price: null,
      };
      setCurrentFeedback(feedback);
      console.log(`Initialized feedback for product ${currentProduct.id}`);
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

  const nextProduct = () => {
    if (currentSurveyStep === 0) {
      // Move to second step (show price)
      setCurrentSurveyStep(1);
      console.log('Moving to second step (showing price)');
    }
    // Note: For step 1, we don't call nextProduct() - we call submitFeedback() directly
  };

  const addFeedback = (rating: number) => {
    // Prevent multiple ratings while processing
    if (showFirstTick || showSecondTick || showSuccess) {
      console.log('Ignoring rating - already processing feedback');
      return;
    }

    if (currentProduct && currentFeedback) {
      const updatedFeedback: FeedbackData = {
        ...currentFeedback,
        rating_without_price: currentSurveyStep === 0 ? rating : currentFeedback.rating_without_price,
        rating_with_price: currentSurveyStep === 1 ? rating : currentFeedback.rating_with_price,
      };

      console.log(`Added ${currentSurveyStep === 0 ? 'without-price' : 'with-price'} rating:`, rating);
      console.log('Updated feedback object:', updatedFeedback);

      // Show appropriate tick based on current step
      if (currentSurveyStep === 0) {
        // First feedback - show black tick
        setCurrentFeedback(updatedFeedback);
        setShowFirstTick(true);
        setTimeout(() => {
          setShowFirstTick(false);
          nextProduct(); // Move to price view
        }, 2000);
      } else {
        // Second feedback - show green tick then submit (works even if first was skipped)
        setShowSecondTick(true);
        setTimeout(() => {
          setShowSecondTick(false);
          // Submit the updatedFeedback directly instead of relying on state
          submitFeedbackWithData(updatedFeedback);
        }, 2000);
      }
    }
  };

  const submitFeedbackWithData = async (feedbackData: FeedbackData) => {
    // Allow submission if at least one rating is provided
    if (feedbackData.rating_without_price !== null || feedbackData.rating_with_price !== null) {
      try {
        console.log('Submitting feedback for product:', feedbackData.product_id);
        console.log('Final feedback data:', feedbackData);
        const success = await postFeedback(feedbackData);
        
        if (success) {
          console.log("Feedback submitted successfully!");
        } else {
          console.error("Failed to submit feedback.");
        }
      } catch (error) {
        console.error("Error submitting feedback:", error);
      } finally {
        // Mark product as completed and show success
        if (currentProduct) {
          setCompletedProductIds(prev => [...prev, currentProduct.id]);
          console.log(`Product ${currentProduct.id} marked as completed`);
        }
        setCurrentFeedback(feedbackData); // Update state with final data
        setShowSuccess(true);
      }
    } else {
      console.error('Cannot submit feedback with no ratings:', feedbackData);
    }
  };

  const submitFeedback = async () => {
    if (currentFeedback && (currentFeedback.rating_without_price !== null || currentFeedback.rating_with_price !== null)) {
      await submitFeedbackWithData(currentFeedback);
    } else {
      console.log('No feedback to submit');
    }
  };

  const startNewSurvey = () => {
    // Find next available product that hasn't been rated
    const availableProducts = products.filter(p => !completedProductIds.includes(p.id));
    
    if (availableProducts.length > 0) {
      // Find index of next available product  
      const nextIndex = getNextAvailableProduct();
      setCurrentProductIndex(nextIndex);
      console.log(`Moving to next product: ${products[nextIndex]?.id} (${availableProducts.length} remaining)`);
    } else {
      // All products completed, start over with first product
      setCurrentProductIndex(0);
      setCompletedProductIds([]); // Reset completed products
      console.log('All products completed! Starting over with full catalog.');
    }
    
    setCurrentSurveyStep(0);
    setCurrentFeedback(null);
    setShowSuccess(false);
    setShowFirstTick(false);
    setShowSecondTick(false);
    
    console.log('Started new survey, remaining products:', products.length - completedProductIds.length);
  };

  const resetSurvey = () => {
    setCurrentProductIndex(0);
    setCurrentSurveyStep(0);
    setCurrentFeedback(null);
    setShowSuccess(false);
    setShowFirstTick(false);
    setShowSecondTick(false);
    setCompletedProductIds([]);
    console.log('Survey reset - all products available again');
  };

  return (
    <SurveyContext.Provider
      value={{
        products,
        currentProductIndex,
        currentProduct,
        currentSurveyStep,
        currentFeedback,
        isLoading,
        showSuccess,
        showFirstTick,
        showSecondTick,
        completedProductIds,
        totalProductsRated,
        nextProduct,
        addFeedback,
        submitFeedback,
        resetSurvey,
        startNewSurvey,
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