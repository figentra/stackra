/**
 * Stackra file contract:
 * Purpose: `packageE2eVite(options)`, the Vite config that serves a package's e2e pages: the app gen writes into
 *          `.stackra/e2e`, with the package's `src/` readable so the page glob reaches it and JSX compiled with the
 *          automatic runtime.
 * Boundary: pure. No plugin: Vite reads the package's `imports` map for `#` aliases itself, and esbuild compiles JSX,
 *           so no React plugin is a dependency.
 * Runtime: node
 * Governing contract: ADR 0022 (the 2026-11-09 amendment: package e2e); ADR 0295 (decision 5).
 */
import type { UserConfig } from "vite";

import type { PackageE2eViteOptions } from "#e2e/package-e2e-vite/package-e2e-vite-options.type";

/**
 * The Vite config of a package's e2e pages.
 *
 * @example
 * export default packageE2eVite({ root });
 */
export function packageE2eVite(options: PackageE2eViteOptions): UserConfig {
  return {
    root: `${options.root}/.stackra/e2e`,
    server: { fs: { allow: [options.root] } },
    esbuild: { jsx: "automatic" },
    logLevel: "warn",
  };
}
