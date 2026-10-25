/**
 * Stackra file contract:
 * Purpose: `parseDecimal(value)`, an exact `Rational` from a decimal string (`"12.50"`, `"-0.0254"`), a safe integer
 *          or a big integer, so a quantity typed by a person or read from data is never rounded through a float.
 * Boundary: internal to the package; pure. A non-integer `number` is refused: its binary value is not the decimal the
 *           caller meant, so the caller passes a string. Exponents, separators and spaces are refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file).
 */
import { rational } from "#core/functions/rational.function";
import type { Rational } from "#core/types/rational.type";

/** A plain decimal: an optional sign, digits, and an optional fraction. */
const DECIMAL = /^([+-]?)(\d+)(?:\.(\d+))?$/;

/**
 * The exact value of `value`.
 *
 * @throws RangeError when `value` is not a plain decimal, or a `number` that is not a safe integer.
 * @example
 * parseDecimal("2.54"); // { num: 127n, den: 50n }
 */
export function parseDecimal(value: string | number | bigint): Rational {
  if (typeof value === "bigint") return rational(value, 1n);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value))
      throw new RangeError(
        `parseDecimal: ${value} is not a safe integer; pass a decimal string instead`,
      );
    return rational(BigInt(value), 1n);
  }
  const match = DECIMAL.exec(value);
  if (match === null) throw new RangeError(`parseDecimal: "${value}" is not a plain decimal`);
  const [, sign = "", whole = "0", fraction = ""] = match;
  const digits = BigInt(`${whole}${fraction}`);
  return rational(sign === "-" ? -digits : digits, 10n ** BigInt(fraction.length));
}
