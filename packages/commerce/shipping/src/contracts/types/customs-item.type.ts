/**
 * Stackra file contract:
 * Purpose: `CustomsItem`, one line of a cross-border shipment's customs declaration: what it is, its tariff code, its
 *          origin, how many, their value and their weight.
 * Boundary: a type in the leaf entry. Which shipments need a declaration and which fields a destination requires are
 *           market-pack data checked by the consumer; the carrier builds the commercial invoice from these lines.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2); ADR 0363 (decision 3: customs rules are pack data).
 */
import type { Money } from "@stackra/money";

/**
 * One declared line.
 *
 * @example
 * const item: CustomsItem = { description: "Cotton shirt", hsCode: "620520", originCountry: "XX", quantity: 2,
 *   value: Money.of("40.00", "USD"), weightG: 600 };
 */
export interface CustomsItem {
  /** A plain description of the goods. */
  readonly description: string;

  /** The Harmonized System code, digits only. */
  readonly hsCode: string;

  /** ISO 3166-1 alpha-2 code of the country the goods were made in. */
  readonly originCountry: string;

  /** Units on this line; a positive whole number. */
  readonly quantity: number;

  /** The value of all units on this line. */
  readonly value: Money;

  /** The weight of all units on this line in grams. */
  readonly weightG: number;
}
