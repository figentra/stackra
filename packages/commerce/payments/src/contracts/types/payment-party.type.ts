/**
 * Stackra file contract:
 * Purpose: `PaymentParty`, the customer as a provider sees them: name, contact and address.
 * Boundary: a type in the leaf entry; every field is optional here and a driver that needs one refuses with
 *           `PaymentFieldRequiredError`. Personal data: drivers send it to the provider only and never log it.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 5).
 */
import type { PaymentAddress } from "#contracts/types/payment-address.type";

/**
 * The party who pays.
 *
 * @example
 * const customer: PaymentParty = { name: "Sara Ali", email, phone: "+966500000000" };
 */
export interface PaymentParty {
  /** The payer's full name. */
  readonly name?: string;

  /** The payer's email address. */
  readonly email?: string;

  /** Phone number in E.164. */
  readonly phone?: string;

  /** Billing or shipping address. */
  readonly address?: PaymentAddress;
}
