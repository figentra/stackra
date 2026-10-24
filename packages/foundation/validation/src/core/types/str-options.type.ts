/**
 * Stackra file contract:
 * Purpose: `StrOptions`, the rules `@Str` records for a string field: length bounds, a pattern, the message key of a
 *          failure and `each` for a list of strings.
 * Boundary: a type only. Gen reads the literal arguments from source and compiles them to `z.string()` checks; a
 *           `string` with no `max` becomes a `text` column (ADR 0294 decision 26).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 26); ADR 0095 as amended.
 */

/** The rules of a string field. */
export interface StrOptions {
  /** The fewest characters. */
  readonly min?: number;

  /** The most characters; also the column length. */
  readonly max?: number;

  /** A pattern the whole value matches, as a RegExp literal. */
  readonly pattern?: RegExp;

  /** The message (an i18n key) of every failure of these rules. */
  readonly message?: string;

  /** The rules apply to each item of a `string[]` field. */
  readonly each?: boolean;
}
