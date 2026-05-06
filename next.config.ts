import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Resource uploads are capped at 10 MB; allow some FormData overhead.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
