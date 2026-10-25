/**
 * Stackra file contract:
 * Purpose: `IdempotencyRecord`, what an `IdempotencyStore` keeps under one scoped Idempotency-Key: the fingerprint of
 *          the input it was first used with and, once the call succeeded, its output.
 * Boundary: a type only. A record without an output is a call still running; a different fingerprint under the same
 *           key is a reused key (ADR 0136 decision 3: `409`).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result for 24 hours).
 */

/** A claimed Idempotency-Key: still running, or done with its output. */
export type IdempotencyRecord =
  | {
      /** The SHA-256 of the call's identity and input, hex. */
      readonly fingerprint: string;
      /** The first call with this key has not finished. */
      readonly done: false;
    }
  | {
      /** The SHA-256 of the call's identity and input, hex. */
      readonly fingerprint: string;
      /** The first call with this key succeeded. */
      readonly done: true;
      /** Its output, replayed to every later call with the same key and fingerprint. */
      readonly output: unknown;
    };
