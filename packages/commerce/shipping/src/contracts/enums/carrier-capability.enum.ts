/**
 * Stackra file contract:
 * Purpose: `CarrierCapability`, what a carrier connection can do: quote rates, buy and cancel labels, book and cancel
 *          courier pickups, report tracking events, search pickup points and lockers, and buy return labels. Each code
 *          names one gateway interface of this entry.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. A connector declares the codes it
 *           serves on its gateway; `hasCarrierCapability` narrows a gateway by them. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2; open questions 1 and 3, COM-156); ADR 0231 (snake_case codes).
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
  /** Searching the carrier's pickup points and lockers near an address (`PickupPointGateway`, COM-156). */
  PickupPoints: "pickup_points",
  /** Buying the carrier's return label for an earlier shipment and cancelling it (`ReturnLabelGateway`). */
  Returns: "returns",
});

/** One of the codes above. */
export type CarrierCapability = Enum.Value<typeof CarrierCapability>;
