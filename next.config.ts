import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "@axe-core/playwright", "playwright-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/playwright/**/*",
      "./node_modules/@sparticuz/chromium-min/**/*"
    ],
  },
};

export default nextConfig;
