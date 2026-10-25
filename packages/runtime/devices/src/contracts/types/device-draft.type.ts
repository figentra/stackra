/**
 * Stackra file contract:
 * Purpose: `DeviceDraft`, what a person gives a device when they enter its pairing code: a name, a kind and the
 *          tenancy node (a store, a branch) it is assigned to.
 * Boundary: a type only. The kinds a product offers (`till`, `kiosk`, `kitchen_display`) are its catalogue data, never
 *           a fixed list here.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); OS 0016 (inventory, pairing, assignment to a tenancy node).
 */

/** A device being registered. */
export interface DeviceDraft {
  /** A name people recognise (`Till 2`). */
  readonly name: string;

  /** The device's kind, snake_case, from the product's catalogue. */
  readonly kind: string;

  /** The tenancy node it is assigned to; null for the tenant itself. */
  readonly nodeId: string | null;
}
