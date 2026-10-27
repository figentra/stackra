/**
 * Stackra file contract:
 * Purpose: `CarrierGateway`, what every carrier connection is: its connection id, its provider code and the
 *          capabilities it serves. The work is in the capability interfaces (`RateGateway`, `LabelGateway`,
 *          `PickupGateway`, `TrackingGateway`), narrowed to with `hasCarrierCapability`.
 * Boundary: an interface an OS integrations connector's `Connection` class implements, not a container port: the
 *           tenant's or the platform's Connection chooses the carrier per call (ADR 0356 decision 2), so the driver is
 *           the connection itself, reached through `CarrierGateways`. No carrier driver lives in this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 1 and 2); ADR 0356 (decision 2).
 */
import type { CarrierCapability } from "#contracts/enums/carrier-capability.enum";

/**
 * One carrier account, as the engine calls it.
 *
 * @example
 * const gateway = await carriers.forMarket(market, [CarrierCapability.Rates]);
 * if (hasCarrierCapability(gateway, CarrierCapability.Rates)) quotes = await gateway.quote(request);
 */
export interface CarrierGateway {
  /** The serving connection's id. */
  readonly id: string;

  /** The provider code, the Integration's `provider`. */
  readonly provider: string;

  /** The capabilities this connection serves. */
  readonly capabilities: readonly CarrierCapability[];
}
