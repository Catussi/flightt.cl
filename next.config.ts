import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mercadopago/sdk-react"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
