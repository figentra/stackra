/**
 * Stackra file contract:
 * Purpose: `REVEAL_DELAY`, how long, in milliseconds, Mod is held alone before the shortcut badges show.
 * Boundary: data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (hold-Mod badges, about 500 ms).
 */

/** Half a second of Mod alone. */
export const REVEAL_DELAY = 500;
