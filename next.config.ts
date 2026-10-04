import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "@axe-core/playwright", "playwright-core"],
};

export default nextConfig;
