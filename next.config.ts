import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // experimental: {
  //   missingSuspenseWithCSRBailout: false,
  // },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  },
};

export default nextConfig;