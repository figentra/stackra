/**
 * Stackra file contract:
 * Purpose: `Party`, the base shape of a person or business a provider is told about: name, contact and postal address.
 *          Payments' customer is this type; shipping's `ShippingParty` extends it.
 * Boundary: a type only; every part is optional here, and a package that needs one narrows it (shipping requires the
 *           name and the address) or refuses at its boundary. Personal data: never logged. Fiscal parties keep their
 *           own document-format shape (`@stackra/fiscal` `FiscalParty`: tax ids, registration and network endpoint).
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (principals and parties); ADR 0357 (decision 2); STA-1383 (one home for duplicated
 *                     value types).
 */
import type { Address } from "#core/types/address.type";

/**
 * A person or business a provider is told about.
 *
 * @example
 * const customer: Party = { name: "Sara Ali", phone: "+966500000000", address: { lines: ["12 King Road"], country: "SA" } };
 */
export interface Party {
  /** The full name, as a provider prints it. */
  readonly name?: string;

  /** An email address. */
  readonly email?: string;

  /** A phone number in E.164. */
  readonly phone?: string;

  /** The postal address. */
  readonly address?: Address;
}
