/**
 * Stackra file contract:
 * Purpose: `countryName(code, locale)`, a country's name in the reader's language, from the host's Intl data.
 * Boundary: pure apart from Intl; no table here. An unknown code returns the code itself, so a label never goes
 *           blank.
 * Runtime: isomorphic
 * Governing contract: row "address and country types" of the package needs (2026-10-25).
 */
import type { CountryCode } from "@stackra/validation";

/**
 * The name of `code` in `locale`.
 *
 * @example
 * countryName("EG", "ar"); // "مصر"
 */
export function countryName(code: CountryCode, locale: string): string {
  return new Intl.DisplayNames([locale], { type: "region", fallback: "code" }).of(code) ?? code;
}
