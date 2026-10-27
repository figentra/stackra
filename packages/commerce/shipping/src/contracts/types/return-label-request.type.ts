/**
 * Stackra file contract:
 * Purpose: `ReturnLabelRequest`, what buying a carrier's return label needs: a `LabelRequest` whose shipper is the
 *          customer sending goods back and whose recipient is the return location, plus the outbound shipment it
 *          returns.
 * Boundary: a type in the leaf entry. Provisional shape: finalised when the Commerce returns spec lands (ADR 0369 open
 *           question 3). A carrier without a return product is served by `LabelGateway.createLabel` with the parties
 *           swapped; this type is for the carrier's own return product (often cheaper, paid only when used).
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2 and 5; open question 3).
 */
import type { LabelRequest } from "#contracts/types/label-request.type";

/**
 * A return label purchase.
 *
 * @example
 * const label = await gateway.createReturnLabel({ ...request, shipper: customer, recipient: warehouse,
 *   outboundShipmentId: shipment.shipmentId });
 */
export interface ReturnLabelRequest extends LabelRequest {
  /** The carrier's id of the outbound shipment being returned, when the carrier links the two. */
  readonly outboundShipmentId?: string;
}
