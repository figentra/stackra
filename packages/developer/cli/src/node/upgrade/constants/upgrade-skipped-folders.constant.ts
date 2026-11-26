/**
 * Stackra file contract:
 * Purpose: `UPGRADE_SKIPPED_FOLDERS`, the folder names `stackra upgrade` never walks into: installs, build output and
 *          what gen writes (gen rewrites it after the upgrade). Every dot folder is skipped too.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** Folder names never read. */
export const UPGRADE_SKIPPED_FOLDERS: ReadonlySet<string> = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  "out",
  "stackra-encore",
]);
