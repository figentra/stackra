/**
 * Stackra file contract:
 * Purpose: `ProviderPackSource`, the port the market-pack `ProviderDefaults` driver reads through: the resolved market
 *          pack of a Market, and the platform Connection a Market's provider of a capability runs on in this
 *          deployment.
 * Boundary: an abstract class that is its own token, key `integrations.ProviderPackSource`. The host binds it over its
 *           pack fetch and storage (`resolvePack` of `@stackra/market-packs` with the tenant's pins) and its deployment
 *           configuration of platform Connections; this package reads neither a pack file nor a connection id itself.
 *           The shape follows payments' `PaymentPackSource`, with the capability added. It lives in `.`, not
 *           `./contracts`, because its signature names `ResolvedPack` of `@stackra/market-packs`.
 * Runtime: isomorphic
 * Governing contract: ADR 0370; ADR 0356 (decisions 3 and 5); ADR 0422 (decision 3).
 */
import { Port } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";

/**
 * Packs and platform Connections, from the host.
 *
 * @example
 * export class OsProviderPackSourceDriver extends Driver(ProviderPackSource) { … }
 */
export abstract class ProviderPackSource extends Port {
  /** Type-only port key. */
  declare readonly "~key": "integrations.ProviderPackSource";

  /**
   * The resolved pack of `market`, overlays and product sections applied.
   *
   * @throws PackNotFoundError when the Market has no pack.
   */
  abstract resolve(market: string): Promise<ResolvedPack>;

  /**
   * The platform Connection that serves `provider` for `capability` in `market`, or undefined when the platform runs
   * none.
   */
  abstract platformConnection(
    capability: string,
    market: string,
    provider: string,
  ): Promise<string | undefined>;
}
