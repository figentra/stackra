/**
 * Stackra file contract:
 * Purpose: the number a `NumberTicker` writes on one frame: whole numbers while it counts between two whole numbers
 *          with no decimals asked for, so the digits do not flicker through fractions; the frame's value otherwise.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer).
 */

/**
 * The value to write on a frame.
 * @param frame - the counted value of this frame
 * @param from - where the count started
 * @param to - where it ends
 * @param format - the caller's number format
 */
export function tickerValueOf(
  frame: number,
  from: number,
  to: number,
  format: Intl.NumberFormatOptions | undefined,
): number {
  const isWhole =
    Number.isInteger(from) &&
    Number.isInteger(to) &&
    !format?.minimumFractionDigits &&
    !format?.maximumFractionDigits;
  return isWhole ? Math.round(frame) : frame;
}
