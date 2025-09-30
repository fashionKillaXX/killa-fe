"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exchangeCodeForToken, storeAuthTokens } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple calls
      if (hasProcessed) {
        console.log('Callback already processed, skipping');
        return;
      }
      
      try {
        setHasProcessed(true);
        setDebugInfo('Checking URL parameters...');

        // Use window.location instead of useSearchParams to avoid build issues
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const state = urlParams.get('state');

        console.log('OAuth callback received:', { code: !!code, error: errorParam, state });
        setDebugInfo(`Code: ${!!code}, Error: ${errorParam}, State: ${state}`);

        if (errorParam) {
          setError(`OAuth error: ${errorParam}`);
          setIsProcessing(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setIsProcessing(false);
          return;
        }

        setDebugInfo('Exchanging code for token...');
        console.log('Exchanging code for token...');

        // Exchange code for tokens via backend
        const tokens = await exchangeCodeForToken(code);
        console.log('Received tokens:', { hasAccessToken: !!tokens.access_token, user: tokens.user });

        setDebugInfo('Storing authentication data...');
        // Store tokens and user data
        storeAuthTokens(tokens);

        setDebugInfo('Updating auth state...');
        // Refresh the auth context to reflect the new auth state
        refreshAuth();

        setDebugInfo('Redirecting to main app...');
        // Small delay to ensure storage and context update are complete
        setTimeout(() => {
          router.push('/');
        }, 500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
        setHasProcessed(false); // Reset on error to allow retry
      }
    };

    // Only run on client side and if not already processed
    if (typeof window !== 'undefined' && !hasProcessed) {
      handleCallback();
    }
  }, [router, refreshAuth, hasProcessed]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-serif">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-2xl font-light text-red-600 mb-4 tracking-wide">
            Authentication Failed
          </h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="border border-black px-8 py-3 text-black text-sm font-light tracking-wide hover:bg-black hover:text-white transition-all duration-300 uppercase"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-serif">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="mb-8">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-light text-black mb-4 tracking-wide">
            Completing Sign In
          </h1>
          <p className="text-gray-600 mb-4">
            {isProcessing ? 'Processing your authentication...' : 'Redirecting...'}
          </p>
          {debugInfo && (
            <p className="text-sm text-gray-500 mt-4 font-mono">
              {debugInfo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}