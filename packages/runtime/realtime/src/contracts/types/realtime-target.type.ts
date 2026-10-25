/**
 * Stackra file contract:
 * Purpose: `RealtimeTarget`, where a `RealtimeTransport` connects: the realtime origin and the one-time subscribe token
 *          of this attempt.
 * Boundary: a type only, in the leaf entry. An empty origin means the page's own origin; a native app always sets it
 *           (the env value `realtimeOrigin`). The token is short-lived and redeemed once, so each attempt asks for a
 *           new one.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: authenticated channels); ADR 0295 (decision 10: env feeds the config).
 */

/** One connection attempt's address and credential. */
export interface RealtimeTarget {
  /** `https://api.acme.example`, or `""` for the page origin. */
  readonly origin: string;

  /** The subscribe token for this attempt. */
  readonly token: string;
}
