"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, ChevronRight, LogIn, LogOut } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
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
    <div className="min-h-screen bg-white text-black max-w-md md:max-w-3xl mx-auto">
      <DesktopNav />
      {/* Page Heading */}
      <div className="px-6 pt-12 text-center">
        <h1 style={{ fontSize: '28px', textAlign: 'left' }}>Profile</h1>
      </div>

      {/* Profile Summary */}
      <div className="px-6 pt-8 pb-8 border-b border-gray-100">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 flex-shrink-0 relative overflow-hidden rounded-[8px]">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1687618083947-691b6c4adb4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkaWVudCUyMGFic3RyYWN0fGVufDF8fHx8MTc2MTM3ODQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Profile gradient"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {isAuthenticated && user?.name
                  ? user.name.substring(0, 2).toUpperCase()
                  : "FE"}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="text-base font-medium truncate">
              {isAuthenticated && user?.name ? user.name : "Fashion Enthusiast"}
            </h2>
            {isAuthenticated && user?.email ? (
              <p className="text-sm text-gray-500 truncate mt-0.5">{user.email}</p>
            ) : (
              <p className="text-sm text-gray-400 mt-0.5">Not signed in</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="pt-6 pb-24">
        {profileSections.map((section, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="text-gray-400 uppercase tracking-[0.12em] text-[10px] px-6 mb-2">
              {section.title}
            </h3>
            <div className="border-t border-gray-100">
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={item.onClick}
                  className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 active:bg-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-gray-500 flex-shrink-0">{item.icon}</div>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
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
