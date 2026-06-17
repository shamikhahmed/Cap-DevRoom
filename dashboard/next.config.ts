import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@cap/devroom-shared"],
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  serverExternalPackages: ["@cursor/sdk", "@cap/devroom-database", "@prisma/client"],
};

export default nextConfig;
