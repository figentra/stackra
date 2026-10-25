/**
 * Stackra file contract:
 * Purpose: `DEVTOOLS_BUFFER_SIZE`, how many stream events the kit keeps for a host's replay.
 * Boundary: a constant only; internal to the package (not exported from the entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 1: development only, so a fixed bound is enough).
 */

/** The newest events kept for replay; older ones are dropped first. */
export const DEVTOOLS_BUFFER_SIZE = 500;
