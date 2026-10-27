/**
 * Stackra file contract:
 * Purpose: `InboundWhatsAppCartItem`, one line of a native WhatsApp cart a customer sent: the catalogue item's
 *          retailer id, the quantity and the unit price the customer saw.
 * Boundary: a type only. The price is a `MoneyAmount` (minor units), never the provider's float.
 * Runtime: isomorphic
 * Governing contract: ADR 0448 (decision 1); ADR 0220 (minor units); COM-297.
 */
import type { MoneyAmount } from "@stackra/money/contracts";

/** One line of a native cart. */
export interface InboundWhatsAppCartItem {
  /** The catalogue item's retailer id (the host's SKU or product reference). */
  readonly productRef: string;

  /** A positive whole number. */
  readonly quantity: number;

  /** The unit price the customer saw. */
  readonly unitPrice: MoneyAmount;
}
