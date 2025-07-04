import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during builds in CI environment
    ignoreDuringBuilds: process.env.DISABLE_ESLINT_PLUGIN === 'true',
  },
};

export default nextConfig;
