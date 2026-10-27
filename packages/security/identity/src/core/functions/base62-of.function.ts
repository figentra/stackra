/**
 * Stackra file contract:
 * Purpose: `base62Of`, a whole number written in base 62 (`0-9A-Za-z`), left-padded with zeros to a fixed width: the
 *          alphabet of an API key's body and checksum (URL-safe, double-click selectable).
 * Boundary: internal and pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 4 and 5).
 */
import { BASE62 } from "#core/constants/base62.constant";

/**
 * `value` in base 62, `width` characters wide.
 *
 * @example
 * base62Of(61, 2); // "0z"
 */
export function base62Of(value: number, width: number): string {
  let text = "";
  for (let rest = value; rest > 0; rest = Math.floor(rest / 62)) text = BASE62[rest % 62] + text;
  return text.padStart(width, "0").slice(-width);
}
