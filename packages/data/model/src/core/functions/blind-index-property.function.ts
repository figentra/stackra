/**
 * Stackra file contract:
 * Purpose: `blindIndexProperty`, the property that holds the blind index of a lookup field: `<field>Bidx` (column
 *          `<field>_bidx` under the snake_case naming), the one place that name is derived.
 * Boundary: a pure name function.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (casing); gap gov9 (stackra-313).
 */

/**
 * The blind-index property of `field`.
 *
 * @example
 * blindIndexProperty("email"); // "emailBidx"
 */
export function blindIndexProperty(field: string): string {
  return `${field}Bidx`;
}
