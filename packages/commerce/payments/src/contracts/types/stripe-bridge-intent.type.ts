/**
 * Stackra file contract:
 * Purpose: `StripeBridgeIntent`, a payment intent as Stripe Terminal's mobile SDK returns it after confirming.
 * Boundary: a type in the leaf entry; the id and status only.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0378 (decision 2).
 */

/**
 * A confirmed intent.
 *
 * @example
 * const { paymentIntent } = await bridge.collectAndConfirm(clientSecret);
 */
export interface StripeBridgeIntent {
  /** The intent id (`pi_…`). */
  readonly id: string;

  /** The intent's status (`requires_capture`, `succeeded`, `processing`, …). */
  readonly status: string;
}
