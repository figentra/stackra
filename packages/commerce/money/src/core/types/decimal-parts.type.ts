/**
 * Stackra file contract:
 * Purpose: `DecimalParts`, an exact decimal as an integer and a count of fraction digits (`12.50` is 1250 and 2), the
 *          form the decimal helpers compute in.
 * Boundary: a type only; internal to the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: exact arithmetic, one explicit rounding).
 */

/** `digits / 10^scale`. */
export interface DecimalParts {
  /** Every digit, signed. */
  readonly digits: bigint;

  /** How many of the digits are after the point; zero or more. */
  readonly scale: number;
}
