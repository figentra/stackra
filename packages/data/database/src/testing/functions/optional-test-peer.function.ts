/**
 * Stackra file contract:
 * Purpose: `optionalTestPeer`, loads a test-only peer a member may leave out (PGlite's PostGIS bundle): the module, or
 *          undefined when it is not installed.
 * Boundary: internal to `./testing`; resolved from this package, as `requireTestPeer` is. Any failure other than "not
 *           installed" is thrown.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0314; STA-1432.
 */
import { testPeerRequire } from "#testing/functions/test-peer-require.function";

/**
 * Loads `name`, or nothing when it is not installed.
 *
 * @example
 * const postgis = optionalTestPeer<{ postgis: Extension }>("@electric-sql/pglite-postgis")?.postgis;
 */
export function optionalTestPeer<T>(name: string): T | undefined {
  try {
    return testPeerRequire<T>(name);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "MODULE_NOT_FOUND" && code !== "ERR_MODULE_NOT_FOUND") throw error;
    return undefined;
  }
}
