import type { NextConfig } from "next";
import { resolve } from "path";

process.loadEnvFile(resolve(process.cwd(), "..", "..", ".env.local"));

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/api-zod", "@workspace/api-client-react", "@workspace/db"],
};

export default nextConfig;
