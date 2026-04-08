import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for easy deployment to GitHub Pages or other static hosts
  output: "export",
  // Set basePath if deploying to GitHub Pages under a subpath
  // basePath: "/demo-collaboration-ag",
};

export default nextConfig;
