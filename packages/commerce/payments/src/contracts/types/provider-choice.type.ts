/**
 * Stackra file contract:
 * Purpose: `ProviderChoice`, one provider a Market offers for payments and the platform Connection that serves it when
 *          the tenant has none of its own.
 * Boundary: a type in the leaf entry; the list per Market is market-pack data read through `MarketPaymentDefaults`.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2, 3 and 5).
 */

/**
 * A Market's provider.
 *
 * @example
 * const choices = await defaults.providers("sa");
 */
export interface ProviderChoice {
  /** The provider code, the Integration's `provider`. */
  readonly provider: string;

  /** The platform Connection for this Market and provider. */
  readonly connectionId: string;
}
