/**
 * Stackra file contract:
 * Purpose: `formatDecimal`, `DecimalParts` back to a plain decimal string with no trailing fraction zeros
 *          (`{ 1250n, 2 }` is `"12.5"`, `{ 7n, 0 }` is `"7"`, `{ -5n, 3 }` is `"-0.005"`).
 * Boundary: internal; pure. A negative scale is not a `DecimalParts`; callers never build one.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: exact arithmetic).
 */
import type { DecimalParts } from "#core/types/decimal-parts.type";

/**
 * The shortest exact decimal string of `parts`.
 *
 * @example
 * formatDecimal({ digits: 109375n, scale: 4 }); // "10.9375"
 */
export function formatDecimal(parts: DecimalParts): string {
  const negative = parts.digits < 0n;
  const absolute = String(negative ? -parts.digits : parts.digits).padStart(parts.scale + 1, "0");
  const whole = absolute.slice(0, absolute.length - parts.scale);
  const fraction = absolute.slice(absolute.length - parts.scale).replace(/0+$/, "");
  const text = fraction === "" ? whole : `${whole}.${fraction}`;
  return negative && text !== "0" ? `-${text}` : text;
}
