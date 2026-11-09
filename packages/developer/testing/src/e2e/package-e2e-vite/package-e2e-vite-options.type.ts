/**
 * Stackra file contract:
 * Purpose: `PackageE2eViteOptions`, what gen's `.stackra/e2e/vite.config.ts` passes `packageE2eVite`: the package root.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0022 (the 2026-11-09 amendment: package e2e); ADR 0295 (decision 5).
 */

/** The options of a package's e2e page server. */
export interface PackageE2eViteOptions {
  /** The package root; the page server serves `<root>/.stackra/e2e` and may read the package's `src/`. */
  readonly root: string;
}
