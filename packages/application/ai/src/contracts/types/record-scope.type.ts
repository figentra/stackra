/**
 * Stackra file contract:
 * Purpose: `RecordScope`, the record an agent's call works in (a matter, a class, a case), as the approval resolver
 *          and the permission matrix key on it: the record kind and, for one record, its public id.
 * Boundary: a type only. It comes from the conversation's context (the record the user opened), never from the
 *           model's output. A matrix row names a kind for every record of that kind, or a kind and an id for one.
 * Runtime: isomorphic
 * Governing contract: X2-12 (a scope-node layer: the matter); J2-6 (scope keys: action, data class, role, record);
 *                     R3-SO-02.
 */

/** A record an agent works in. */
export interface RecordScope {
  /** The record kind (`matter`). */
  readonly kind: string;

  /** The record's public id; absent in a matrix row that covers every record of the kind. */
  readonly id?: string;
}
