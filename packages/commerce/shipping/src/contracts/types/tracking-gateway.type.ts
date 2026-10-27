/**
 * Stackra file contract:
 * Purpose: `TrackingGateway`, the capability of a carrier connection that reports a shipment's carrier events, and the
 *          map that normalises its codes.
 * Boundary: an interface a connector's `Connection` implements (`CarrierCapability.Tracking`); see `CarrierGateway`.
 *           `trackingMap` is the connector's data; the engine runs `normaliseTracking` on polled and webhook events
 *           alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2 and 4).
 */
import type { CarrierEvent } from "#contracts/types/carrier-event.type";
import type { TrackingMap } from "#contracts/types/tracking-map.type";

/**
 * The carrier gateway that tracks shipments.
 *
 * @example
 * const timeline = normaliseTracking(await gateway.track(shipmentId), gateway.trackingMap);
 */
export interface TrackingGateway {
  /** This carrier's codes to normalised states. */
  readonly trackingMap: TrackingMap;

  /** Every event the carrier holds for the shipment, in any order. */
  track(shipmentId: string): Promise<readonly CarrierEvent[]>;
}
