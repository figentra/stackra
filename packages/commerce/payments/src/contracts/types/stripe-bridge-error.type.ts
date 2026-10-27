/**
 * Stackra file contract:
 * Purpose: `StripeBridgeError`, an error of Stripe Terminal's mobile SDK as `StripeTerminalBridge` returns it.
 * Boundary: a type in the leaf entry; codes and messages only, never card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0378 (decision 2).
 */

/**
 * An SDK error.
 *
 * @example
 * if (result.error !== undefined) throw PaymentDeclinedError.create({ provider: "stripe", providerCode: result.error.code });
 */
export interface StripeBridgeError {
  /** The SDK's error code. */
  readonly code: string;

  /** The SDK's message. */
  readonly message?: string;
}
