/**
 * Stackra file contract:
 * Purpose: `DECODED_ENVELOPE`, the symbol under which a refusal decoded from a producer's answer keeps its envelope, so
 *          its kind and `retryable` follow what the producer sent.
 * Boundary: a symbol key, so the envelope is never one of the refusal's enumerable details. Not exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope).
 */

/** The envelope slot of a decoded refusal. */
export const DECODED_ENVELOPE: unique symbol = Symbol("stackra.clients.envelope");
