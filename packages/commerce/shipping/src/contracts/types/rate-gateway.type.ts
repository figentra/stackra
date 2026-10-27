/**
 * Stackra file contract:
 * Purpose: `RateGateway`, the capability of a carrier connection that quotes live rates.
 * Boundary: an interface a connector's `Connection` implements (`CarrierCapability.Rates`); see `CarrierGateway`.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2).
 */
import type { RateQuote } from "#contracts/types/rate-quote.type";
import type { RateRequest } from "#contracts/types/rate-request.type";

/**
 * The carrier gateway that quotes live rates.
 *
 * @example
 * if (hasCarrierCapability(gateway, CarrierCapability.Rates)) quotes = await gateway.quote(request);
 */
export interface RateGateway {
  /**
   * The services the carrier offers for `request`, each priced.
   *
   * @returns an empty list when the carrier serves no service between the two addresses.
   */
  quote(request: RateRequest): Promise<readonly RateQuote[]>;
}
