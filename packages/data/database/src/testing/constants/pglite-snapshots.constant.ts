/**
 * Stackra file contract:
 * Purpose: `PGLITE_SNAPSHOTS`, the snapshots built or read so far in this process, by key (migrations hash, PGlite build and extension list).
 * Boundary: immutable snapshot bytes (a `Blob` of the data directory), never a live PGlite; a test clears it to force the file layer.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */

/** Snapshot of a migrated data directory, by key. */
export const PGLITE_SNAPSHOTS = new Map<string, Promise<Blob>>();
