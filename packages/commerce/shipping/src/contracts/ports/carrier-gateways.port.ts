/**
 * Stackra file contract:
 * Purpose: `CarrierGateways`, the port that hands the engine a `CarrierGateway` for a call: for a Market and the
 *          capabilities the call needs, or for the connection that bought an earlier label of the same shipment.
 * Boundary: an abstract class that is its own token, key `shipping.CarrierGateways`. Its driver applies ADR 0356 (the
 *           tenant's own Connection first, then the Market's platform Connection) and lives with the Connection store
 *           in OS integrations; which carriers a Market offers is market-pack data. A test binds an object literal. A
 *           leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 3); ADR 0356 (decisions 2 to 5); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { CarrierCapability } from "#contracts/enums/carrier-capability.enum";
import type { CarrierGateway } from "#contracts/types/carrier-gateway.type";

/**
 * Which carrier serves a call.
 *
 * @example
 * const gateway = await carriers.forMarket(market, [CarrierCapability.Labels, CarrierCapability.Pickups]);
 */
export abstract class CarrierGateways extends Port {
  /** Type-only port key. */
  declare readonly "~key": "shipping.CarrierGateways";

  /**
   * The gateway for `market` that has every capability in `needs`.
   *
   * @throws NoCarrierError when no carrier of the Market has them all.
   */
  abstract forMarket(market: string, needs: readonly CarrierCapability[]): Promise<CarrierGateway>;

  /**
   * The gateway of connection `connectionId` of `provider`: the one that bought the label, so a cancel, pickup or
   * tracking call goes to the same account.
   *
   * @throws NoCarrierError when `provider` is not a carrier connector.
   */
  abstract byConnection(provider: string, connectionId: string): Promise<CarrierGateway>;

  /**
   * Every carrier gateway `market` offers that has every capability in `needs`, preferred first; checkout shows live
   * quotes from each.
   *
   * @returns an empty list when none has them all.
   */
  abstract allForMarket(
    market: string,
    needs: readonly CarrierCapability[],
  ): Promise<readonly CarrierGateway[]>;
}
