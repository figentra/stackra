/**
 * Stackra file contract:
 * Purpose: `AttachmentVisibilityCacheOptions`, how long and how many answers `AttachmentVisibilityCache` keeps, and the
 *          clock it reads.
 * Boundary: a type only; the cache checks the values when it is built.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (2026-10-24 amendment); STA-1960.
 */
import type { Clock } from "@stackra/contracts";

/**
 * The cache's limits.
 *
 * @example
 * const options: AttachmentVisibilityCacheOptions = { ttlMs: 15_000, maxEntries: 5_000 };
 */
export interface AttachmentVisibilityCacheOptions {
  /** How long an answer is reused, in milliseconds: above 0 and at most 60 000. Default 30 000. */
  readonly ttlMs?: number;
  /** The most answers kept; the oldest goes first when it is full. A positive integer. Default 10 000. */
  readonly maxEntries?: number;
  /** The clock expiry is read from. Default the host clock. */
  readonly clock?: Clock;
}
