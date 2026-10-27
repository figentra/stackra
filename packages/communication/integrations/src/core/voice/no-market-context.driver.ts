/**
 * Stackra file contract:
 * Purpose: `NoMarketContextDriver`, a `MarketContext` that answers no Market, for the resolver `SpeechService` builds
 *          over the region map: the region is always passed, and without one only the tenant's own Connections are
 *          tried, never a Market code in place of a region.
 * Boundary: internal to the voice folder, not exported and never bound in a container; the host's `MarketContext`
 *           stays the one bound.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decisions 2 and 7); ADR 0356 (decision 3).
 */
import { Driver } from "@stackra/container";

import { MarketContext } from "#contracts/ports/market-context.port";

/**
 * No Market.
 *
 * @example
 * new ProviderResolver(store, new RegionMapProviderDefaultsDriver(regions), new NoMarketContextDriver());
 */
export class NoMarketContextDriver extends Driver(MarketContext) {
  /** Always undefined. */
  market(): string | undefined {
    return undefined;
  }
}
