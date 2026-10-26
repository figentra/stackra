/**
 * Stackra file contract:
 * Purpose: `MoneyAmount`, the wire form of a `Money`: whole minor units and the ISO 4217 code, the shape money fields
 *          take in API requests and responses, event payloads and stored JSON (`{ minor: 1850, currency: "SAR" }`).
 * Boundary: a type only, plain JSON. `currency` is a plain string here (this leaf imports nothing from `core`);
 *           `Money.ofMinor(amount.minor, amount.currency)` checks and rebuilds it, `{ minor, currency }` of a `Money` is
 *           one. A decimal string is a display form (`Money.toDecimal()`), never the wire form. A price finer than a
 *           minor unit (a metal rate per gram) travels as a `RateSnapshot` or a `UnitPrice`, not as this.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 1: minor units and ISO 4217 codes); ADR 0117 (decision 2: types-only
 *                     contracts).
 */

/** An amount of money as it travels. */
export interface MoneyAmount {
  /** The amount in minor units of `currency`: a safe integer, negative for a debit or a refund. */
  readonly minor: number;

  /** The ISO 4217 code, upper case (`"SAR"`, `"KWD"`, `"JPY"`). */
  readonly currency: string;
}
