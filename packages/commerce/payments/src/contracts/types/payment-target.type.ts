/**
 * Stackra file contract:
 * Purpose: `PaymentTarget`, how a driver finds one payment: the merchant's reference and, once known, the provider's id.
 * Boundary: a type in the leaf entry; a driver prefers `providerRef` and falls back to `reference` where its provider can
 *           search by it (the lookup that resolves the `unknown` state).
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6).
 */

/**
 * One payment, by reference.
 *
 * @example
 * await gateway.lookup({ reference: record.reference, providerRef: record.providerRef });
 */
export interface PaymentTarget {
  /** The merchant's id of the payment. */
  readonly reference: string;

  /** The provider's id, when known. */
  readonly providerRef?: string;
}
