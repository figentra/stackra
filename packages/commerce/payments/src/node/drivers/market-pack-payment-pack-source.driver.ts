/**
 * Stackra file contract:
 * Purpose: `MarketPackPaymentPackSourceDriver`, the production `PaymentPackSource`: a Market's resolved pack from the
 *          deployment's verified packs (`ResolvedPackSource` and `resolvePack` of `@stackra/market-packs`), and the
 *          platform Connection of a provider from `PaymentsConfig.platformConnections`.
 * Boundary: the driver named `market_pack`. It reads no pack file and no credential: the packs come from whatever
 *           `ResolvedPackSource` driver the host runs, the Connection ids from deployment configuration (packs are
 *           signed market facts shared by every deployment, so a deployment's Connection ids never sit in one).
 *           Resolution passes on `PackNotFoundError`.
 * Runtime: node
 * Governing contract: ADR 0370; ADR 0356 (decisions 3 and 5); ADR 0418; STA-1705.
 */
import { Driver } from "@stackra/container";
import { resolvePack, type ResolvedPack, type ResolvedPackSource } from "@stackra/market-packs";

import type { PaymentsConfig } from "#config/payments.config";
import { PaymentPackSource } from "#contracts/ports/payment-pack-source.port";

/**
 * Packs from the deployment's pack source, platform Connections from its configuration.
 *
 * @example
 * const source = new MarketPackPaymentPackSourceDriver(packs, config);
 * await source.platformConnection("eu", "stripe"); // "conn_…"
 */
export class MarketPackPaymentPackSourceDriver extends Driver(PaymentPackSource) {
  /** The deployment's verified packs. */
  private readonly packs: ResolvedPackSource;

  /** The platform Connections. */
  private readonly config: PaymentsConfig;

  /**
   * @param packs - the deployment's resolved-pack source.
   * @param config - the payments configuration.
   */
  constructor(packs: ResolvedPackSource, config: PaymentsConfig) {
    super();
    this.packs = packs;
    this.config = config;
  }

  /** The Market's live pack layers. */
  async resolve(market: string): Promise<ResolvedPack> {
    // shortcut: no tenant pins or sections, every tenant reads the live pack; pass them once tenant pins are stored.
    return resolvePack(await this.packs.packs(), market);
  }

  /** The configured platform Connection of `provider` in `market`, or undefined. */
  async platformConnection(market: string, provider: string): Promise<string | undefined> {
    return this.config.platformConnections[market]?.[provider];
  }
}
