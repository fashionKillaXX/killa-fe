import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Allowed remote hosts for next/image. When NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    // is set, every SKU image is rewritten through res.cloudinary.com (see
    // src/lib/imageUrl.ts), so we mainly need that host. The brand-CDN entries
    // below are kept as a fallback so the FE still renders if Cloudinary is
    // unconfigured (e.g. local dev with no env var).
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "api.fitcurry.shop" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Long-tail Indian brand origins (no real CDN — slow direct fetch).
      // Listed here so unoptimized fallback still works; in normal operation
      // Cloudinary proxies these.
      { protocol: "https", hostname: "thefuncompany.in" },
      { protocol: "https", hostname: "www.turnblack.in" },
      { protocol: "https", hostname: "oluolin.com" },
      { protocol: "https", hostname: "www.5feet11.com" },
      { protocol: "https", hostname: "daysforclothing.com" },
      { protocol: "https", hostname: "garuda-ss.com" },
      { protocol: "https", hostname: "www.six5sixstreet.com" },
      { protocol: "https", hostname: "labelankitajain.com" },
      { protocol: "https", hostname: "www.innersaintss.com" },
      { protocol: "https", hostname: "leavetherest.com" },
      { protocol: "https", hostname: "prkhr.shop" },
      { protocol: "https", hostname: "sakhe.in" },
      { protocol: "https", hostname: "indianweddingoutfit.com" },
      { protocol: "https", hostname: "**.dm2buy.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.fitcurry.shop",
  },
};

export default nextConfig;
