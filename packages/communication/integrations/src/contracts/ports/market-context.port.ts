/**
 * Stackra file contract:
 * Purpose: `MarketContext`, the port that names the Market the running call acts in, so a provider default can be
 *          looked up for it.
 * Boundary: an abstract class that is its own token, key `integrations.MarketContext`. The host binds it: which Market
 *           keys a non-payment capability (the tenant's, the recipient's country, the legal entity's) is an open
 *           question of ADR 0356, answered by the host's binding, never here. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 3, open question 1); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

/**
 * The running call's Market.
 *
 * @example
 * export class TenantMarketContextDriver extends Driver(MarketContext) { market() { return this.tenant.market; } }
 */
export abstract class MarketContext extends Port {
  /** Type-only port key. */
  declare readonly "~key": "integrations.MarketContext";

  /** The Market code (`sa`, `ae-difc`); undefined when the call has none, so only the tenant's own Connection serves. */
  abstract market(): string | undefined;
}
