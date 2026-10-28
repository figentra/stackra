/**
 * Stackra file contract:
 * Purpose: `NoMarketContextDriver`, a `MarketContext` that answers no Market, for the resolver `SpeechService` builds
 *          over the region map: the region is always passed, and without one only the tenant's own Connections are
 *          tried, never a Market code in place of a region.
 * Boundary: internal to the voice folder, not exported and never bound in a container; the host's `MarketContext`
 *           stays the one bound.
 *           The no-market stand-in this package uses itself; `internal`, so no host selects it (ADR 0266 2026-10-28 note).
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decisions 2 and 7); ADR 0356 (decision 3).
 */
import { Driver } from "@stackra/container";

import { MarketContext } from "#contracts/ports/market-context.port";

/**
 * A `MarketContext` that answers no Market, for the speech resolver built over the region map.
 *
 * @example
 * new ProviderResolver(store, new RegionMapProviderDefaultsDriver(regions), new NoMarketContextDriver());
 */
export class NoMarketContextDriver extends Driver(MarketContext, { internal: true }) {
  /** Answers undefined, so the resolver never uses a Market code in place of a region. */
  market(): string | undefined {
    return undefined;
  }
}
