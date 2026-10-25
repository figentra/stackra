/**
 * Stackra file contract:
 * Purpose: `RealtimeLink`, one open connection a `RealtimeTransport` returns, which its caller can close.
 * Boundary: a type only, in the leaf entry. Closing is idempotent and reports nothing to the handlers.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decision 15).
 */

/** A connection its caller owns. */
export interface RealtimeLink {
  /** Closes the link; safe to call more than once. */
  close(): void;
}
