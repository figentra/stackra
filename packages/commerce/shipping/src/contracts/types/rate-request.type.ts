/**
 * Stackra file contract:
 * Purpose: `RateRequest`, what a carrier needs to quote: from where, to where, the parcels, and the amounts that change
 *          a price (declared value for insurance, a cash-on-delivery amount to collect).
 * Boundary: a type in the leaf entry. Whether a live quote, a table rate or a flat rate is shown is the consumer's
 *           shipping-rate rule set; this is only the live-quote call.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2); ADR 0363 (decision 2: shipping rates are a rule set).
 */
import type { Money } from "@stackra/money";

import type { Parcel } from "#contracts/types/parcel.type";
import type { ShippingAddress } from "#contracts/types/shipping-address.type";

/**
 * A quote request.
 *
 * @example
 * const quotes = await gateway.quote({ origin, destination, parcels: [parcel] });
 */
export interface RateRequest {
  /** Where the carrier collects. */
  readonly origin: ShippingAddress;

  /** Where the carrier delivers. */
  readonly destination: ShippingAddress;

  /** The boxes, at least one. */
  readonly parcels: readonly Parcel[];

  /** The goods' value, when the carrier prices insurance or duties on it. */
  readonly declaredValue?: Money;

  /** The amount the courier collects from the recipient, when the order is cash on delivery. */
  readonly cashOnDelivery?: Money;

  /** Only these service codes, when the caller already knows which it offers. */
  readonly services?: readonly string[];
}
