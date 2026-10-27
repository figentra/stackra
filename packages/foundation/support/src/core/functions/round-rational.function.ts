/**
 * Stackra file contract:
 * Purpose: `roundRational`, an exact fraction rounded to a whole big integer by a `QuantityRounding` mode, for
 *          `Quantity.roundTo` and `Quantity.priceMinor`.
 * Boundary: internal to @stackra/support (not re-exported). Integer arithmetic only, never a float.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file).
 */
import type { QuantityRounding } from "#core/types/quantity-rounding.type";
import type { Rational } from "#core/types/rational.type";

/**
 * `value` rounded to a whole number: `half_up` half away from zero, `down` toward zero, `up` away from zero.
 *
 * @example
 * roundRational({ num: 5n, den: 2n }, "half_up"); // 3n
 */
export function roundRational(value: Rational, mode: QuantityRounding): bigint {
  const whole = value.num / value.den;
  const rest = value.num % value.den;
  if (rest === 0n) return whole;
  const away = whole + (value.num < 0n ? -1n : 1n);
  if (mode === "down") return whole;
  if (mode === "up") return away;
  if (mode === "half_up") return (rest < 0n ? -rest : rest) * 2n >= value.den ? away : whole;
  throw new RangeError(`Quantity: unknown rounding mode "${String(mode)}"`);
}
