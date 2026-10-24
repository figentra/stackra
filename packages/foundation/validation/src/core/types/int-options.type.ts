/**
 * Stackra file contract:
 * Purpose: `IntOptions`, the rules `@Int` records for a whole-number field: bounds, the message key of a failure and
 *          `each` for a list or a map of whole numbers.
 * Boundary: a type only. Gen compiles them to `z.number().int()` checks; a `number` field carries `@Int` or `@Num`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 6 and 26); ADR 0095 as amended.
 */

/** The rules of a whole-number field. */
export interface IntOptions {
  /** The smallest value, inclusive. */
  readonly min?: number;

  /** The largest value, inclusive. */
  readonly max?: number;

  /** The message (an i18n key) of every failure of these rules. */
  readonly message?: string;

  /** The rules apply to each value of a `number[]` or a map of numbers. */
  readonly each?: boolean;
}
