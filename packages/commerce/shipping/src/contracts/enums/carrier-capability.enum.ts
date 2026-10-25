/**
 * Stackra file contract:
 * Purpose: `CarrierCapability`, what a carrier connection can do: quote rates, buy and cancel labels, book and cancel
 *          courier pickups, and report tracking events. Each code names one gateway interface of this entry.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. A connector declares the codes it
 *           serves on its gateway; `hasCapability` narrows a gateway by them. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The carrier capabilities the shipping engine asks for.
 *
 * @example
 * const gateway = await carriers.forMarket(market, [CarrierCapability.Labels]);
 */
export const CarrierCapability = Enum.of({
  /** Rate quotes for parcels between two addresses (`RateGateway`). */
  Rates: "rates",
  /** Buying a label for a shipment and cancelling it before hand-over (`LabelGateway`). */
  Labels: "labels",
  /** Booking a courier pickup and cancelling it (`PickupGateway`). */
  Pickups: "pickups",
  /** The carrier's tracking events for a shipment and the map that normalises them (`TrackingGateway`). */
  Tracking: "tracking",
});

/** One of the codes above. */
export type CarrierCapability = Enum.Value<typeof CarrierCapability>;
