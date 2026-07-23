import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mercadopago/sdk-react"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
