/**
 * Stackra file contract:
 * Purpose: `TrackingState`, the one shipment state model every carrier's events are normalised into, so notifications,
 *          reports and rules read the same states whatever the carrier. Each case says whether it is terminal.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Which carrier code maps to which
 *           state is connector data (`TrackingMap`), never code here; what the shopper is told on a state is a rule or a
 *           workflow of the consumer. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 4); ADR 0363 (decision 2); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * Normalised tracking states; `Enum.meta(TrackingState, state).terminal` is true where a shipment's journey ends.
 *
 * @example
 * if (Enum.meta(TrackingState, timeline.state).terminal) stopPolling(shipmentId);
 */
export const TrackingState = Enum.of({
  /** The label exists; the carrier does not have the parcel yet. */
  LabelCreated: ["label_created", { terminal: false }],
  /** The carrier has the parcel and it is moving. */
  InTransit: ["in_transit", { terminal: false }],
  /** On the vehicle for the last leg today. */
  OutForDelivery: ["out_for_delivery", { terminal: false }],
  /** Waiting at a pickup point or locker for the recipient. */
  ReadyForPickup: ["ready_for_pickup", { terminal: false }],
  /** Handed to the recipient. */
  Delivered: ["delivered", { terminal: true }],
  /** A delivery attempt failed (nobody home, refused, wrong address); another attempt or a return follows. */
  DeliveryFailed: ["delivery_failed", { terminal: false }],
  /** On its way back to the shipper. */
  ReturningToOrigin: ["returning_to_origin", { terminal: false }],
  /** Back with the shipper. */
  Returned: ["returned", { terminal: true }],
  /** The label was cancelled before hand-over. */
  Cancelled: ["cancelled", { terminal: true }],
  /** Held, damaged, lost or otherwise stuck; someone has to look. */
  Exception: ["exception", { terminal: false }],
});

/** One of the codes above. */
export type TrackingState = Enum.Value<typeof TrackingState>;
