/**
 * Stackra file contract:
 * Purpose: `MarketPaymentDefaults`, the port that answers which payment providers a Market offers, in order, each
 *          with the platform Connection that serves it when the tenant has none of its own.
 * Boundary: an abstract class that is its own token, key `payments.MarketPaymentDefaults`. The answer is market-pack
 *           data (the pack's payments part), bound by the host's market-pack loader; this package names no Market and
 *           no provider for one. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 3 and 5: platform market defaults are data); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { ProviderChoice } from "#contracts/types/provider-choice.type";

/**
 * The Market's providers, from data.
 *
 * @example
 * export class MarketPackPaymentDefaultsDriver extends Driver(MarketPaymentDefaults) { … }
 */
export abstract class MarketPaymentDefaults extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.MarketPaymentDefaults";

  /**
   * The providers `market` offers, preferred first.
   *
   * @returns an empty list for a Market with no payments.
   */
  abstract providers(market: string): Promise<readonly ProviderChoice[]>;
}
