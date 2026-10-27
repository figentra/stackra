/**
 * Stackra file contract:
 * Purpose: `BRAND_DEFAULTS`, the default folders and file names of a generator run (the values `BrandKitOptions` and
 *          `BrandKitRunOptions` document).
 * Boundary: data only; a run overrides any of them through its options.
 * Runtime: isomorphic
 * Governing contract: ADR 0044 and ADR 0146 (config keys); ADR 0441 (as amended).
 */

/** Default run folders, relative to the repository root, and the manifest's file name inside the output folder. */
export const BRAND_DEFAULTS = Object.freeze({
  kitDir: "assets/brand",
  outDir: ".stackra/brand",
  storeDir: "assets/store",
  screenshotsDir: ".stackra/screenshots",
  manifestFile: "asset-manifest.json",
} as const);
