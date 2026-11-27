/**
 * Stackra file contract:
 * Purpose: `CATALOGUE_PATHS`, where the error-code catalogue is read and written: the reference page (the source) and
 *          `@stackra/gen`'s `error-codes.constant.ts` (the copy), from the repository root.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: STA-2853; STA-2891.
 */

/** The page and the catalogue file, relative to the repository root. */
export const CATALOGUE_PATHS = {
  page: "apps/docs/src/docs/customers/error-codes.mdx",
  catalogue: "packages/developer/gen/src/core/constants/error-codes.constant.ts",
} as const;
