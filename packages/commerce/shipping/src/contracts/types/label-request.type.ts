/**
 * Stackra file contract:
 * Purpose: `LabelRequest`, what buying a label needs: the caller's idempotency reference, the chosen service, both
 *          parties, the parcels, the document format and stock, and the optional amounts and customs lines.
 * Boundary: a type in the leaf entry. `reference` makes a retried call return the same shipment instead of buying a
 *           second label; a connector passes it to the carrier or keeps its own map.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2, 3 and 5).
 */
import type { Money } from "@stackra/money";

import type { LabelFormat } from "#contracts/enums/label-format.enum";
import type { CustomsItem } from "#contracts/types/customs-item.type";
import type { Parcel } from "#contracts/types/parcel.type";
import type { ShippingParty } from "#contracts/types/shipping-party.type";

/**
 * A label purchase.
 *
 * @example
 * const shipment = await gateway.createLabel({ reference: fulfilmentId, service: quote.service, shipper, recipient,
 *   parcels, format: LabelFormat.Pdf });
 */
export interface LabelRequest {
  /** The caller's id for this shipment; the same reference never buys two labels. */
  readonly reference: string;

  /** The service code from a `RateQuote`. */
  readonly service: string;

  /** Who sends. */
  readonly shipper: ShippingParty;

  /** Who receives. */
  readonly recipient: ShippingParty;

  /** The boxes, at least one; one label each. */
  readonly parcels: readonly Parcel[];

  /** The document format the location prints. */
  readonly format: LabelFormat;

  /** The label stock code the connector knows (a page or roll size), from the location's printer setting. */
  readonly stock?: string;

  /** The goods' value, for insurance or duties. */
  readonly declaredValue?: Money;

  /** The amount the courier collects, when the order is cash on delivery. */
  readonly cashOnDelivery?: Money;

  /** The customs declaration, for a cross-border shipment. */
  readonly customs?: readonly CustomsItem[];
}
