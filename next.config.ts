import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Temporarily disable ESLint for builds
    // Remaining issues are in test files and mocks - will fix in separate PR
    // ignoreDuringBuilds: true,
  },
};

export default nextConfig;
