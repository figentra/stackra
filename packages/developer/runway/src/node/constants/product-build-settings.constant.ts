/**
 * Stackra file contract:
 * Purpose: `PRODUCT_BUILD_SETTINGS`, where a product build and deploy write: the shell line checkouts, each surface's
 *          generated bundle entry, the mobile template checkouts, and the build and deploy manifests.
 * Boundary: data only; `buildProduct` and `deployProduct` read it. The bundles themselves go where the publish step reads
 *           them (`EDGE_PUBLISH_SETTINGS.bundleDir`).
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); ADR 0439; ADR 0481.
 */

/** The product build's paths, relative to the product root. */
export const PRODUCT_BUILD_SETTINGS = Object.freeze({
  /** A surface's shell line checkout. */
  lineDir: (surface: string): string => `.stackra/lines/${surface}`,
  /** A surface's generated bundle entry: imports every product package's surface entry. */
  entryFile: (surface: string): string => `.stackra/surfaces/${surface}/bundle-entry.ts`,
  /** A mobile app's template checkout, where its EAS build runs. */
  mobileDir: (app: string): string => `.stackra/mobile/${app}`,
  /** The build manifest: what was built, for the deploy and the CI artifacts. */
  manifest: "dist/product/build.json",
  /** The deploy manifest of one environment. */
  deployManifest: (environment: string): string => `dist/product/deploy-${environment}.json`,
} as const);
