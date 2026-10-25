/**
 * Stackra file contract:
 * Purpose: `PAYLOAD_KEY`, the key under which the `secrets` area holds the session's payload key, the one the
 *          `PayloadSeal` drivers seal the `outbox` and `cache` payloads with.
 * Boundary: internal to the package's seal drivers; the value it names is a secret and is never logged or sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 2).
 */

/** The `secrets` key of the payload key. */
export const PAYLOAD_KEY = "storage.payload_key";
