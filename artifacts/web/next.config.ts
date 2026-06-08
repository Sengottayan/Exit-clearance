import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/api-zod", "@workspace/api-client-react", "@workspace/db"],
};

export default nextConfig;
