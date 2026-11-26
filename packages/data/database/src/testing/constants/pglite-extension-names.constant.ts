/**
 * Stackra file contract:
 * Purpose: `PGLITE_EXTENSION_NAMES`, the approved extensions every PGlite and test database carries: all of ADR
 *          0160's. PostGIS (ADR 0314) is added where its PGlite bundle is installed (`loadPglitePeers`).
 * Boundary: names only; `loadPglitePeers` loads the bundles.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */

/** The approved extension names. */
export const PGLITE_EXTENSION_NAMES = ["vector", "ltree", "pg_trgm", "citext", "pgcrypto"] as const;
