import type { NextConfig } from "next";

import pkg from "./package.json" with { type: "json" };

const config: NextConfig = {
  typedRoutes: true,
  // Workspace packages export TypeScript source, so Next must compile every @stackra/* dependency.
  transpilePackages: Object.keys(pkg.dependencies).filter((name) => name.startsWith("@stackra/")),
};

export default config;
