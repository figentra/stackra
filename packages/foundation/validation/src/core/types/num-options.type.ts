/**
 * Stackra file contract:
 * Purpose: `NumOptions`, the rules `@Num` records for a field that holds any finite number: bounds, an exclusive lower
 *          bound, the message key of a failure and `each` for a list or a map of numbers.
 * Boundary: a type only. Gen compiles them to `z.number()` checks (`exclusiveMin` to `.gt()`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 6 and 26); ADR 0095 as amended.
 */

/** The rules of a finite-number field. */
export interface NumOptions {
  /** The smallest value, inclusive. */
  readonly min?: number;

  /** The largest value, inclusive. */
  readonly max?: number;

  /** A value the number must be greater than. */
  readonly exclusiveMin?: number;

  /** The message (an i18n key) of every failure of these rules. */
  readonly message?: string;

  /** The rules apply to each value of a `number[]` or a map of numbers. */
  readonly each?: boolean;
}
