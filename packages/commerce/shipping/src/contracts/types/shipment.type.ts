/**
 * Stackra file contract:
 * Purpose: `Shipment`, what a carrier returns for a bought label: its shipment id, the tracking numbers, the service,
 *          the label documents and the charge.
 * Boundary: a type in the leaf entry. `shipmentId` is the carrier's; cancel and tracking calls take it back.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2 and 5).
 */
import type { Money } from "@stackra/money";

import type { LabelDocument } from "#contracts/types/label-document.type";

/**
 * A bought label.
 *
 * @example
 * await store.save({ fulfilmentId, carrierShipmentId: shipment.shipmentId, tracking: shipment.trackingNumbers });
 */
export interface Shipment {
  /** The carrier's id of the shipment. */
  readonly shipmentId: string;

  /** One tracking number per parcel, in parcel order (some carriers give one for all). */
  readonly trackingNumbers: readonly string[];

  /** The service code the label was bought for. */
  readonly service: string;

  /** The labels to print; a carrier may return one document for all parcels. */
  readonly labels: readonly LabelDocument[];

  /** What the carrier charged, when it says at purchase. */
  readonly charge?: Money;
}
