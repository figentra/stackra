/**
 * Stackra file contract:
 * Purpose: `CacheEntry`, one stored value with the instant it stops being fresh and, when it was stored with a stale
 *          window, the instant it stops being served at all.
 * Boundary: a type only, internal to the package. Instants are epoch milliseconds on the driver's `Clock`. An outside
 *           store keeps it as JSON text (`textEntryStore`); the memory driver keeps it by reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1 and 4).
 */

/** A stored value and its expiry. */
export interface CacheEntry {
  /** What the caller stored. */
  readonly value: unknown;

  /** From this instant the value is not fresh: `get` misses and `remember` loads (or serves it stale). */
  readonly expiresAt: number;

  /** Until this instant `remember` still serves the value while one load replaces it; absent with no stale window. */
  readonly staleUntil?: number;
}
