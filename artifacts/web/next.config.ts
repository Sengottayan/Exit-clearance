import type { NextConfig } from "next";
import { existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), "..", "..", ".env.local");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/api-zod", "@workspace/api-client-react", "@workspace/db"],
};

export default nextConfig;
