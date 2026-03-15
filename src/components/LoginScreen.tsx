"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await login(email);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center max-w-md mx-auto px-8">
      {/* Logo */}
      <h1 className="text-4xl mb-2">Fitcurry</h1>
      <p className="text-gray-500 text-sm mb-12 text-center">
        Discover indie Indian fashion, curated for your style
      </p>

      {/* Google Sign In */}
      <button
        onClick={() => loginWithGoogle()}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-[8px] py-3.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative w-full my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">or</span>
        </div>
      </div>

      {/* Email Sign In */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isLoading) handleEmailSignIn();
        }}
        className="w-full border border-gray-300 rounded-[8px] py-3.5 px-4 text-sm focus:outline-none focus:border-black transition-colors mb-4"
      />
      <button
        onClick={handleEmailSignIn}
        disabled={!email.trim() || isLoading}
        className="w-full bg-black text-white py-3.5 rounded-[8px] text-sm tracking-wide uppercase disabled:opacity-40 transition-opacity"
      >
        {isLoading ? "Signing in..." : "Continue with Email"}
      </button>
    </div>
  );
}
