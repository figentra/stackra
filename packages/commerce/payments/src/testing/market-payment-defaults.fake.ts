/**
 * Stackra file contract:
 * Purpose: `MarketPaymentDefaultsFake`, a `MarketPaymentDefaults` over a literal map of Market to providers, standing
 *          in for the market-pack loader in tests.
 * Boundary: test support from `./testing`; the Market codes and providers are whatever the test writes.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fakes in ./testing); ADR 0356 (decision 5).
 */
import { MarketPaymentDefaults } from "#contracts/ports/market-payment-defaults.port";
import type { ProviderChoice } from "#contracts/types/provider-choice.type";

/**
 * Market defaults from a map.
 *
 * @example
 * const defaults = MarketPaymentDefaultsFake.with({ m1: [{ provider: "stripe", connectionId: "conn_1" }] });
 */
export class MarketPaymentDefaultsFake extends MarketPaymentDefaults {
  /** Providers by Market. */
  private markets: Readonly<Record<string, readonly ProviderChoice[]>> = {};

  // A constructor takes class tokens only (ADR 0294 rule 17), so `with` fills the fields.
  private constructor() {
    super();
  }

  /** A fake over `markets`. */
  static with(
    markets: Readonly<Record<string, readonly ProviderChoice[]>>,
  ): MarketPaymentDefaultsFake {
    const fake = new MarketPaymentDefaultsFake();
    fake.markets = markets;
    return fake;
  }

  /** The providers set for `market`, or none. */
  async providers(market: string): Promise<readonly ProviderChoice[]> {
    return this.markets[market] ?? [];
  }
}
