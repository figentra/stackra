/**
 * Stackra file contract:
 * Purpose: `earnPoints`, the whole points an amount earns at a rate: floor(amountMinor × earnPerMinor), computed exactly.
 * Boundary: pure. The rate is a JavaScript number the scope's `earnPerMinor` setting holds (0.29 as typed), and a binary
 *           float cannot hold it: `0.29 * 100` is 28.999999999999996, which floors to 28 where the answer is 29. So the
 *           product is formed from the rate's shortest decimal text (the one `0.29` prints as) in integers, and floored
 *           there. A result beyond the safe integers is refused, never rounded.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (integer minor units, no floats); ADR 0454 (decision 2: the earn rate is a setting);
 *                     ADR 0294 (decisions 2 and 15).
 */

/** A decimal as `Number#toString` prints it: digits, an optional fraction and an optional exponent. */
const DECIMAL = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i;

/**
 * The whole points `amountMinor` earns at `earnPerMinor` points per minor unit, rounded down.
 *
 * @param amountMinor - a safe integer number of minor units; a negative amount (a correction) rounds toward minus infinity.
 * @param earnPerMinor - a finite rate of at least zero.
 * @throws RangeError when the amount is not a safe integer, the rate is not finite or is negative, or the result is not
 *         a safe integer.
 * @example
 * earnPoints(100, 0.29); // 29, where Math.floor(100 * 0.29) is 28
 * earnPoints(5000, 0.01); // 50
 * earnPoints(9, 0.1); // 0
 */
export function earnPoints(amountMinor: number, earnPerMinor: number): number {
  if (!Number.isSafeInteger(amountMinor))
    throw new RangeError(
      `earnPoints: the amount is a safe integer of minor units, not ${amountMinor}`,
    );
  if (!Number.isFinite(earnPerMinor) || earnPerMinor < 0)
    throw new RangeError(
      `earnPoints: the rate is a finite number of at least zero, not ${earnPerMinor}`,
    );
  const match = DECIMAL.exec(String(earnPerMinor));
  // `String` of a finite non-negative number always matches; the guard keeps the type honest.
  if (match === null) throw new RangeError(`earnPoints: ${earnPerMinor} is not a decimal`);
  const [, whole = "0", fraction = "", exponent = "0"] = match;
  // rate = digits / 10^scale, with digits = whole and fraction side by side
  const digits = BigInt(`${whole}${fraction}`);
  const scale = fraction.length - Number(exponent);
  const amount = BigInt(amountMinor);
  const product = scale >= 0 ? amount * digits : amount * digits * 10n ** BigInt(-scale);
  const divisor = scale >= 0 ? 10n ** BigInt(scale) : 1n;
  let points = product / divisor;
  // BigInt division truncates toward zero; the points round down, so a negative remainder takes one more
  if (product % divisor !== 0n && product < 0n) points -= 1n;
  if (points > BigInt(Number.MAX_SAFE_INTEGER) || points < BigInt(Number.MIN_SAFE_INTEGER))
    throw new RangeError(
      `earnPoints: ${amountMinor} at ${earnPerMinor} is beyond the safe integers`,
    );
  return Number(points);
}
