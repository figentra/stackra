/**
 * Stackra file contract:
 * Purpose: `quoteIdentifier`, the one way a table, column, index or schema name enters compiled SQL: checked as a
 *          snake_case Postgres identifier, then double-quoted.
 * Boundary: internal; refuses rather than escapes, so a frozen migration snapshot only ever holds plain names and a
 *           name Postgres would truncate (over 63 bytes) is an error, never a silent rename.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case database names); ADR 0159 (literal, frozen migrations).
 */

/** A snake_case identifier: lowercase letters, digits and underscores, not starting with a digit. */
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

/** The longest identifier Postgres keeps whole. */
const MAX_LENGTH = 63;

/**
 * The quoted form of `name`.
 *
 * @throws TypeError when `name` is not a snake_case identifier of at most 63 characters.
 * @example
 * quoteIdentifier("order_lines"); // "\"order_lines\""
 */
export function quoteIdentifier(name: string): string {
  if (!IDENTIFIER.test(name) || name.length > MAX_LENGTH)
    throw new TypeError(
      `"${name}" is not a database name: snake_case, at most ${MAX_LENGTH} characters`,
    );
  return `"${name}"`;
}
