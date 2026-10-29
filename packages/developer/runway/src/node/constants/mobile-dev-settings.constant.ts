/**
 * Stackra file contract:
 * Purpose: `MOBILE_DEV_SETTINGS`, the template-line contract a local mobile run writes to: where the checkout goes,
 *          the module listing the product packages' native entries, the file naming their folders for Metro, and the
 *          export a package's native entry is.
 * Boundary: data only; `prepareMobileDev` reads it. The paths are the mobile template's (figentra/os `apps/mobile`
 *           README): a template line that moves them changes this file and nothing else.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 2); ADR 0481.
 */

/** Where a local mobile run writes. */
export const MOBILE_DEV_SETTINGS = Object.freeze({
  /** The checkout folder of an app, under the product root. */
  dir: (app: string): string => `.stackra/mobile/${app}`,
  /** The template module that lists the product packages' native entries. */
  productModules: "src/products/product-modules.ts",
  /** The file that names the product packages' folders, so Metro resolves their imports from the app. */
  productRoots: "products.json",
  /** The package export a product's mobile screens are registered from. */
  nativeExport: "./native",
} as const);
