/**
 * Stackra file contract:
 * Purpose: `FactSource`, what a consumer registers so its rules may test facts: a key and the typed fields under it
 *          (customer attributes, cart totals, order history aggregates, record fields).
 * Boundary: a type only, and a description only: the consumer computes the facts itself and passes them to
 *           `evaluate`; the engine knows no commerce and loads nothing. A rule names a field as `<source>.<field>`
 *           (`cart.total`), and a field no registered source describes cannot be tested (ADR 0331 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4 and 10).
 */
import type { FactField } from "#contracts/types/fact-field.type";

/**
 * A consumer's facts.
 *
 * @example
 * export const CART_FACTS = {
 *   key: "cart",
 *   fields: { total: { type: FieldType.Money, label: "promotions::facts.cart_total" } },
 * } satisfies FactSource;
 */
export interface FactSource {
  /** The source's camelCase key, the first part of each field path. */
  readonly key: string;

  /** The fields, by camelCase key. */
  readonly fields: Readonly<Record<string, FactField>>;
}
