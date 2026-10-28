/**
 * Stackra file contract:
 * Purpose: `LabelGateway`, the capability of a carrier connection that buys a label for a shipment and cancels it
 *          before hand-over.
 * Boundary: an interface a connector's `Connection` implements (`CarrierCapability.Labels`); see `CarrierGateway`.
 *           A connector builds each returned document with `labelDocument`, so a wrong format never reaches a printer.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2, 3 and 5).
 */
import type { LabelRequest } from "#contracts/types/label-request.type";
import type { Shipment } from "#contracts/types/shipment.type";

/**
 * The carrier gateway that creates shipping labels and cancels shipments.
 *
 * @example
 * const shipment = await gateway.createLabel(request);
 * await gateway.cancel(shipment.shipmentId);
 */
export interface LabelGateway {
  /** Buys a label; a repeated `request.reference` returns the shipment already bought. */
  createLabel: (request: LabelRequest) => Promise<Shipment>;

  /** Cancels an unused label so the carrier does not charge it; cancelling twice is not an error. */
  cancel: (shipmentId: string) => Promise<void>;
}
