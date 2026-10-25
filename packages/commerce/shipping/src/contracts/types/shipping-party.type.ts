/**
 * Stackra file contract:
 * Purpose: `ShippingParty`, the shipper or the recipient on a label or pickup: a name, contact details and an address.
 * Boundary: a type in the leaf entry. Personal data (name, phone, email, address): a connector sends it to the carrier
 *           and never logs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2).
 */
import type { ShippingAddress } from "#contracts/types/shipping-address.type";

/**
 * Who sends or receives.
 *
 * @example
 * const recipient: ShippingParty = { name: "A. Shopper", phone: "+10000000000", address };
 */
export interface ShippingParty {
  /** The person's name as printed on the label. */
  readonly name: string;

  /** The company, when the party is a business. */
  readonly company?: string;

  /** A phone number in E.164 form; carriers call or message it on delivery. */
  readonly phone?: string;

  /** An email address. */
  readonly email?: string;

  /** Where the parcel goes to or comes from. */
  readonly address: ShippingAddress;
}
