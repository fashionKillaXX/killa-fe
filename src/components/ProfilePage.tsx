"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, ChevronRight, LogIn, LogOut } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SignInSheet } from "@/components/SignInSheet";
import { toast } from "sonner";

/**
 * ProfilePage displays user profile info, account actions, and preferences.
 * Uses Next.js router for navigation instead of callback props.
 */
export function ProfilePage() {
  const router = useRouter();
  const { onboardingData } = useOnboarding();
  const { user, isAuthenticated, logout } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
  };

  const handleEditPreferences = () => {
    if (isAuthenticated) {
      router.push("/preferences");
    } else {
      setShowSignIn(true);
    }
  };

  const profileSections = [
    {
      title: "Account",
      items: [
        ...(isAuthenticated
          ? [
            {
              icon: <LogOut className="w-5 h-5" />,
              label: "Sign Out",
              onClick: handleLogout,
            },
          ]
          : [
            {
              icon: <LogIn className="w-5 h-5" />,
              label: "Sign In / Sign Up",
              onClick: () => setShowSignIn(true),
            },
          ]),
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <Settings className="w-5 h-5" />,
          label: "Edit Style Preferences",
          onClick: handleEditPreferences,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black max-w-md mx-auto">
      {/* Page Heading */}
      <div className="px-6 pt-12 text-center">
        <h1 style={{ fontSize: '28px', textAlign: 'left' }}>Chef in question</h1>
      </div>

      {/* Profile Summary */}
      <div className="px-6 pt-8 pb-8">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 relative overflow-hidden mb-4 rounded-[8px]">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1687618083947-691b6c4adb4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkaWVudCUyMGFic3RyYWN0fGVufDF8fHx8MTc2MTM3ODQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Profile gradient"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl text-white">
                {isAuthenticated && user?.name
                  ? user.name.substring(0, 2).toUpperCase()
                  : "FE"}
              </span>
            </div>
          </div>
          <h2 className="text-xl">{isAuthenticated && user?.name ? user.name : "Fashion Enthusiast"}</h2>

          {isAuthenticated && user?.email ? (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-gray-500">{user.email}</p>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="py-6 pb-24">
        {profileSections.map((section, idx) => (
          <div key={idx} className="mb-10">
            <h3 className="text-gray-400 uppercase tracking-widest text-xs px-6 mb-4">
              {section.title}
            </h3>
            <div>
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={item.onClick}
                  className="w-full px-6 py-5 flex items-center justify-between active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-gray-600">{item.icon}</div>
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Reusable Sign In Sheet Component */}
      <SignInSheet open={showSignIn} onOpenChange={setShowSignIn} />
    </div>
  );
}
