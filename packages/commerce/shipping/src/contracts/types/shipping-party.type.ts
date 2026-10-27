/**
 * Stackra file contract:
 * Purpose: `ShippingParty`, the shipper or the recipient on a label or pickup: the base `Party` of
 *          `@stackra/validation` with the name and address a carrier requires, and the company of a business.
 * Boundary: a type in the leaf entry. Personal data (name, phone, email, address): a connector sends it to the carrier
 *           and never logs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2); ADR 0361 (parties); STA-1383 (one home for duplicated value types).
 */
import type { Party } from "@stackra/validation";

import type { ShippingAddress } from "#contracts/types/shipping-address.type";

/**
 * Who sends or receives.
 *
 * @example
 * const recipient: ShippingParty = { name: "A. Shopper", phone: "+10000000000", address };
 */
export interface ShippingParty extends Party {
  /** The person's name as printed on the label. */
  readonly name: string;

  /** The company, when the party is a business. */
  readonly company?: string;

  /** Where the parcel goes to or comes from. */
  readonly address: ShippingAddress;
}
