const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  // Only use outputFileTracingRoot on Abacus.AI server, not on Vercel
  experimental: process.env.VERCEL
    ? {}
    : {
        outputFileTracingRoot: path.join(__dirname, '../'),
      },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
