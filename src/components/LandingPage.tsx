"use client";

import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:justify-center font-serif">
      <div className="max-w-2xl mx-auto w-full flex flex-col shadow-2xl rounded-none lg:rounded-2xl bg-white overflow-hidden min-h-[90vh] relative border border-gray-200">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 text-center">
          
          {/* Elegant Heading */}
          <div className="mb-16 lg:mb-20">
            <h1 className="text-2xl lg:text-5xl font-light text-black mb-6 lg:mb-8 tracking-[0.15em] lg:tracking-[0.2em] leading-relaxed">
              FASHION SURVEY
            </h1>
            <div className="w-24 h-px bg-black mx-auto mb-8 lg:mb-12"></div>
            <h2 className="text-lg lg:text-2xl font-light text-gray-600 tracking-[0.1em] lg:tracking-[0.15em]">
              PRODUCT RATINGS
            </h2>
          </div>

          {/* Description */}
          <div className="mb-12 lg:mb-16 max-w-md">
            <p className="text-sm lg:text-base text-gray-600 font-light leading-loose tracking-wide">
              Share your opinion on fashion products to help improve recommendations. 
              Your feedback helps us understand style preferences.
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="group relative border border-black px-8 lg:px-12 py-3 lg:py-4 text-black text-sm lg:text-base font-light tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 focus:outline-none uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 lg:gap-4">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </div>
          </button>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 font-light tracking-wide mt-8 lg:mt-12 max-w-sm">
            By continuing, you agree to participate in our fashion research study. 
            Your responses are anonymous and used for research purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
