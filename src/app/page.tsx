"use client";

import { useAuth } from '@/contexts/AuthContext';
import { SurveyProvider, useSurvey } from '@/contexts/SurveyContext';
import LandingPage from '@/components/LandingPage';
import ProductDisplay from '@/components/ProductDisplay';
import SuccessPopup from '@/components/SuccessPopup';

function SurveyApp() {
  const { currentProduct, isLoading, showSuccess, addFeedback, nextProduct } = useSurvey();

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center font-serif">
        <div className="text-center">
          <div className="w-16 h-16 border border-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black text-lg font-light tracking-wide">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center font-serif">
        <div className="text-center">
          <p className="text-black text-lg font-light tracking-wide">No products available</p>
        </div>
      </div>
    );
  }

  // Show success screen instead of product display when survey is complete
  if (showSuccess) {
    return <SuccessPopup />;
  }

  return (
    <ProductDisplay
      product={currentProduct}
      onRatingSelect={addFeedback}
      onSkip={nextProduct}
    />
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center font-serif">
        <div className="text-center">
          <div className="w-16 h-16 border border-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black text-lg font-light tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if user is not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show survey if user is authenticated
  return (
    <SurveyProvider>
      <SurveyApp />
    </SurveyProvider>
  );
}

export default function Page() {
  return <AppContent />;
}