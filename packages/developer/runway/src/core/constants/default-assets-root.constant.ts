/**
 * Stackra file contract:
 * Purpose: `DEFAULT_ASSETS_ROOT`, the assets tree's root when the root runway has no `assets` block.
 * Boundary: internal; `checkSurfaces` reads it. A product that keeps its tree elsewhere says so in `assets.root`.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 1: every product repository has a root `assets/` tree).
 */

/** `assets`. */
export const DEFAULT_ASSETS_ROOT = "assets";
