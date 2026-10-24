/**
 * Stackra file contract:
 * Purpose: `RealtimeToken`, what `RealtimeHub.issueToken` returns to the authenticated endpoint that hands it to the
 *          client: the one-time subscribe token and the instant it stops working.
 * Boundary: a type only. The token is random and opaque, redeemed once on connect; the connection it opens is closed
 *           at `expiresAt`, so the session's permissions are re-read at least once per `subscribeTokenTtl`.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: authenticated channels).
 */

/** A subscribe token and its expiry. */
export interface RealtimeToken {
  /** The opaque one-time token. */
  readonly token: string;

  /** When the token, and any connection opened with it, ends. */
  readonly expiresAt: Date;
}
