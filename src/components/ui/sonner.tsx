"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      duration={2000}
      toastOptions={{
        classNames: {
          toast: "group toast !bg-white !text-black !border !border-gray-200 !rounded-lg !shadow-[0px_4px_12px_0px_rgba(0,0,0,0.12)] !py-4 !px-4 !pr-12 relative flex items-center gap-3",
          closeButton: "!absolute !right-3 !top-1/2 !-translate-y-1/2 !left-auto !bg-transparent !border-0 !text-gray-400 hover:!text-black !p-0 !w-5 !h-5 transition-colors !transform",
        },
      }}
      style={
        {
          "--normal-bg": "#fff",
          "--normal-text": "#000",
          "--normal-border": "#e5e7eb",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
