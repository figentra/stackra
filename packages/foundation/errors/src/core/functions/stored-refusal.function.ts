/**
 * Stackra file contract:
 * Purpose: `storedRefusal`, a refusal in the form a store keeps: its envelope with the kind and without any trace.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 1); STA-2532.
 */
import type { Refusal } from "#core/bases/refusal.base";
import type { StoredRefusal } from "#core/types/stored-refusal.type";

/**
 * The stored form of `refusal`.
 *
 * @example
 * await store.completeRefused(key, fingerprint, storedRefusal(error), ttl);
 */
export function storedRefusal(refusal: Refusal): StoredRefusal {
  return { kind: refusal.kind, ...refusal.toEnvelope() };
}
