/**
 * Stackra file contract:
 * Purpose: `Fulfilment`, a fulfilment provider's state of one order: its id there, the state and, once shipped, the
 *          carrier and tracking number.
 * Boundary: a type only. The state is normalised to five values; anything else the provider reports maps to the
 *           nearest.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); COM-147.
 */

/** An order at the fulfilment provider. */
export interface Fulfilment {
  /** The provider's id. */
  readonly providerRef: string;

  /** Where it is. */
  readonly state: "accepted" | "in_progress" | "shipped" | "cancelled" | "failed";

  /** The carrier, once shipped. */
  readonly carrier?: string;

  /** The tracking number, once shipped. */
  readonly trackingNumber?: string;
}
