import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export for easy deployment to GitHub Pages or other static hosts
  output: "export",
  // GitHub Pages deploys under /<repo-name>/
  basePath: isProd ? "/demo-collaboration-ag" : "",
  assetPrefix: isProd ? "/demo-collaboration-ag/" : "",
};

export default nextConfig;
