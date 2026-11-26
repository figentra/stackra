/**
 * Stackra file contract:
 * Purpose: `UPGRADE_SOURCE_EXTENSIONS`, the file extensions `stackra upgrade` runs its source codemods over.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** TypeScript and JavaScript, with and without JSX. */
export const UPGRADE_SOURCE_EXTENSIONS: readonly string[] = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
];
