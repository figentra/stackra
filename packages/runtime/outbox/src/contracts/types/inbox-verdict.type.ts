/**
 * Stackra file contract:
 * Purpose: `InboxVerdict`, what an `InboxVerifier` decides about one inbox request: the verified producer and the key
 *          that signed it, or why it is refused.
 * Boundary: a type only. A refusal reason is a machine code for the log; the inbox answers 401 for every one and never
 *           tells the caller which.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11, 16 and 18).
 */

/** The outcome of verifying one inbox request. */
export type InboxVerdict =
  | { readonly verified: true; readonly producer: string; readonly keyId: string }
  | {
      readonly verified: false;
      readonly reason: "missing_headers" | "stale" | "unknown_key" | "bad_signature";
    };
