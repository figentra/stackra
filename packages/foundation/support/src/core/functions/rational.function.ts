/**
 * Stackra file contract:
 * Purpose: `rational(num, den)`, the one way to build a `Rational`: it moves the sign to the numerator and reduces the
 *          fraction, so two equal quantities always have equal parts.
 * Boundary: internal to the package; pure. A zero denominator is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file).
 */
import type { Rational } from "#core/types/rational.type";

/** The greatest common divisor of two non-negative big integers. */
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

/**
 * The reduced fraction `num / den`.
 *
 * @throws RangeError when `den` is zero.
 * @example
 * rational(10n, -4n); // { num: -5n, den: 2n }
 */
export function rational(num: bigint, den: bigint): Rational {
  if (den === 0n) throw new RangeError("rational: the denominator is zero");
  const sign = den < 0n ? -1n : 1n;
  const n = num * sign;
  const d = den * sign;
  const divisor = gcd(n < 0n ? -n : n, d) || 1n;
  return Object.freeze({ num: n / divisor, den: d / divisor });
}
