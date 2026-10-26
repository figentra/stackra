/**
 * Stackra file contract:
 * Purpose: `MethodsGateway`, the port a driver adds when its provider reports which payment methods the account has
 *          enabled (cards, wallets, pay-later, bank methods), so checkout offers what the account has and no separate
 *          driver exists per wallet.
 * Boundary: an interface in the leaf entry. Method codes are the provider's own (`card`, `klarna`, `ideal`); which ones
 *           show is the account's setting at the provider, never a list here.
 * Runtime: isomorphic
 * Governing contract: R4-4 (wallets and pay-later read from the Stripe account); R3-SO-04; ADR 0357 (decision 2).
 */

/**
 * Reads the account's enabled payment methods.
 *
 * @example
 * const methods = await gateway.paymentMethods(); // ["card", "klarna", "link"]
 */
export interface MethodsGateway {
  /** The provider codes of the payment methods the account can take now. */
  paymentMethods(): Promise<readonly string[]>;
}
