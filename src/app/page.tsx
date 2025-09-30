"use client";

import { useAuth } from '@/contexts/AuthContext';
import { SurveyProvider } from '@/contexts/SurveyContext';
import LandingPage from '@/components/LandingPage';
import ProductDisplay from '@/components/ProductDisplay';
import SuccessPopup from '@/components/SuccessPopup';
import { useSurvey } from '@/contexts/SurveyContext';

// Survey App Component (shows when authenticated)
function SurveyApp() {
  const {
    currentProduct,
    currentSurveyStep,
    isLoading,
    showSuccess,
    addFeedback,
    nextProduct,
    submitFeedback,
    startNewSurvey
  } = useSurvey();
  const { user, signOut } = useAuth();

  // Debug logging
  console.log('Survey state:', { showSuccess, isLoading, currentProduct: !!currentProduct });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-serif">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-light text-black mb-4 tracking-wide">Loading Products</h1>
          <p className="text-gray-600 mb-4">Preparing your fashion survey...</p>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-serif">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-2xl font-light text-black mb-4 tracking-wide">No Products Available</h1>
          <p className="text-gray-600 mb-4">Unable to load products for the survey.</p>
          <button
            onClick={signOut}
            className="text-black underline hover:no-underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* User Info Bar */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-4 bg-white bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200">
        <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
        <button
          onClick={signOut}
          className="text-xs text-gray-500 hover:text-black transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Survey Content */}
      <ProductDisplay
        product={currentProduct}
        onRatingSelect={(rating) => {
          addFeedback(rating); // Context handles the flow internally
        }}
        onSkip={() => {
          addFeedback(0); // 0 maps to 'skip' type
        }}
      />

      {/* Success Popup */}
      {showSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <SuccessPopup />
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-serif">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-light text-black mb-4 tracking-wide">Loading...</h1>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <SurveyProvider>
        <SurveyApp />
      </SurveyProvider>
    );
  }

  return <LandingPage />;
}