/**
 * Stackra file contract:
 * Purpose: `decimalParts`, a number (read as the decimal it prints as) or a plain decimal string as exact
 *          `DecimalParts`: `0.875` is 875 and 3, `"251.420000"` is 251420000 and 6, `1e-7` is 1 and 7.
 * Boundary: internal; pure. Refusals are `RangeError`s: a non-finite number or a string that is not a plain decimal.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: exact arithmetic).
 */
import type { DecimalParts } from "#core/types/decimal-parts.type";

/** A plain decimal: optional minus, digits, optional fraction. */
const DECIMAL = /^(-)?(\d+)(?:\.(\d+))?$/;

/**
 * The exact parts of `value`.
 *
 * @example
 * decimalParts("12.50"); // { digits: 1250n, scale: 2 }
 * @throws RangeError when `value` is not finite or not a plain decimal.
 */
export function decimalParts(value: number | string): DecimalParts {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new RangeError(`decimal: ${value} is not finite`);
    const [mantissa = "0", exponentText = "0"] = String(value).split("e");
    const exponent = Number(exponentText);
    const parsed = decimalParts(mantissa);
    return exponent >= 0
      ? { digits: parsed.digits * 10n ** BigInt(exponent), scale: parsed.scale }
      : { digits: parsed.digits, scale: parsed.scale - exponent };
  }
  const match = DECIMAL.exec(value);
  if (match === null) throw new RangeError(`decimal: "${value}" is not a decimal such as "12.50"`);
  const [, sign, whole = "0", fraction = ""] = match;
  const digits = BigInt(whole + fraction);
  return { digits: sign === undefined ? digits : -digits, scale: fraction.length };
}
