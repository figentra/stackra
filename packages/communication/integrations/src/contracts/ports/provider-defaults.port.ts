/**
 * Stackra file contract:
 * Purpose: `ProviderDefaults`, the port that answers which providers a Market offers for a capability (`sms`,
 *          `whatsapp`, `voice`, `geocoding`, `accounting`), in order, each with the platform Connection that serves it
 *          when the tenant has none of its own.
 * Boundary: an abstract class that is its own token, key `integrations.ProviderDefaults`. The answer is market-pack data
 *           (the pack's providers part), bound by the host's market-pack loader: platform market defaults are data,
 *           not code (ADR 0356 decision 5), so no Market and no provider is named here. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 3 and 5); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { ProviderChoice } from "#contracts/types/provider-choice.type";

/**
 * A Market's providers for a capability, from data.
 *
 * @example
 * export class MarketPackProviderDefaultsDriver extends Driver(ProviderDefaults) { … }
 */
export abstract class ProviderDefaults extends Port {
  /** Type-only port key. */
  declare readonly "~key": "integrations.ProviderDefaults";

  /**
   * The providers `market` offers for `capability`, preferred first.
   *
   * @returns an empty list when the Market offers none.
   */
  abstract providers(capability: string, market: string): Promise<readonly ProviderChoice[]>;
}
