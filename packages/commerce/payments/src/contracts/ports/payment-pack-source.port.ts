/**
 * Stackra file contract:
 * Purpose: `PaymentPackSource`, the port the market-pack `MarketPaymentDefaults` driver reads through: the resolved
 *          market pack of a Market, and the platform Connection a Market's provider runs on in this deployment.
 * Boundary: an abstract class that is its own token, key `payments.PaymentPackSource`. The host binds it over its pack
 *           fetch and storage (`resolvePack` of `@stackra/market-packs` with the tenant's pins) and its deployment
 *           configuration of platform Connections; this package reads neither a pack file nor a connection id itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0370; ADR 0356 (decisions 3 and 5); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";

/**
 * Packs and platform Connections, from the host.
 *
 * @example
 * export class OsPaymentPackSourceDriver extends Driver(PaymentPackSource) { … }
 */
export abstract class PaymentPackSource extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.PaymentPackSource";

  /**
   * The resolved pack of `market`, overlays and product sections applied.
   *
   * @throws PackNotFoundError when the Market has no pack.
   */
  abstract resolve(market: string): Promise<ResolvedPack>;

  /** The platform Connection that serves `provider` in `market`, or undefined when the platform runs none. */
  abstract platformConnection(market: string, provider: string): Promise<string | undefined>;
}
