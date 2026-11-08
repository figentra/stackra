/**
 * Stackra file contract:
 * Purpose: `extensionsSql`, the `create extension` statements for the approved extensions a database has: by default
 *          the five every PGlite and test image carry; PGlite passes the ones it loaded (PostGIS when its peer is
 *          installed, ADR 0314).
 * Boundary: builds text only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */
import { PGLITE_EXTENSION_NAMES } from "#testing/constants/pglite-extension-names.constant";

/** `create extension` for each of `names`. */
export function extensionsSql(names: readonly string[] = PGLITE_EXTENSION_NAMES): string {
  return names.map((name) => `create extension if not exists ${name};`).join("\n");
}
