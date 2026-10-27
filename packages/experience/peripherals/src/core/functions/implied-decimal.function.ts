/**
 * Stackra file contract:
 * Purpose: `impliedDecimal`, the decimal string of barcode digits that carry a fixed number of implied decimals
 *          (`"001250"` with 3 is `"1.250"`), shared by the in-store and the GS1 barcode parsers.
 * Boundary: internal; pure. The digits are already checked to be digits; leading zeros of the whole part go, the
 *           fraction keeps every digit.
 * Runtime: isomorphic
 * Governing contract: the COM-241 answer; ADR 0339 (decision 7); STA-965.
 */

/**
 * `digits` read with `decimals` implied decimals.
 *
 * @example
 * impliedDecimal("001250", 3); // "1.250"
 * impliedDecimal("0899", 0); // "899"
 */
export function impliedDecimal(digits: string, decimals: number): string {
  const padded = digits.padStart(decimals + 1, "0");
  const cut = padded.length - decimals;
  const whole = padded.slice(0, cut).replace(/^0+(?=\d)/, "");
  return decimals === 0 ? whole : `${whole}.${padded.slice(cut)}`;
}
