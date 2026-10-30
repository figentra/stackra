/**
 * Stackra file contract:
 * Purpose: `PGLITE_BOOTSTRAPS`, a count of the full bootstraps (initdb, extensions, migrations) this process ran to build a snapshot.
 * Boundary: a counter only; tests read it to prove a second database did not bootstrap again.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */

/** How many times this process booted and migrated a PGlite from scratch to build a snapshot. */
export const PGLITE_BOOTSTRAPS = { count: 0 };
