"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      if (hasProcessed) return;
      setHasProcessed(true);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const errorParam = urlParams.get("error");

        if (errorParam) {
          setError(`OAuth error: ${errorParam}`);
          return;
        }

        if (!code) {
          setError("No authorization code received");
          return;
        }

        await handleGoogleCallback(code);
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => router.push("/"), 500);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setHasProcessed(false);
      }
    };

    if (typeof window !== "undefined" && !hasProcessed) {
      processCallback();
    }
  }, [router, handleGoogleCallback, hasProcessed]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-2xl text-red-600 mb-4">Authentication Failed</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="border border-black px-8 py-3 text-black text-sm tracking-wide hover:bg-black hover:text-white transition-all duration-300 uppercase"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-2xl text-black mb-4">Completing Sign In</h1>
        <p className="text-gray-600">Processing your authentication...</p>
      </div>
    </div>
  );
}