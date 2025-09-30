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
  // Experimental features can be enabled here when needed
  // experimental: {
  //   // Feature flags go here
  // },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://ec2-3-111-169-63.ap-south-1.compute.amazonaws.com:8000',
  },
};

export default nextConfig;