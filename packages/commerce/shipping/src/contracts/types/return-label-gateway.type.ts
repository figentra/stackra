/**
 * Stackra file contract:
 * Purpose: `ReturnLabelGateway`, the capability of a carrier connection that buys its own return label for a shipment
 *          and cancels it while unused.
 * Boundary: an interface a connector's `Connection` implements (`CarrierCapability.Returns`); see `CarrierGateway`.
 *           A connector builds each returned document with `labelDocument`. Provisional until the Commerce returns
 *           spec lands (ADR 0369 open question 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2, 3 and 5; open question 3).
 */
import type { ReturnLabelRequest } from "#contracts/types/return-label-request.type";
import type { Shipment } from "#contracts/types/shipment.type";

/**
 * Return labels.
 *
 * @example
 * const shipment = await gateway.createReturnLabel(request);
 * await gateway.cancelReturnLabel(shipment.shipmentId);
 */
export interface ReturnLabelGateway {
  /** Buys a return label; a repeated `request.reference` returns the shipment already bought. */
  createReturnLabel(request: ReturnLabelRequest): Promise<Shipment>;

  /** Cancels an unused return label; cancelling twice is not an error. */
  cancelReturnLabel(shipmentId: string): Promise<void>;
}
