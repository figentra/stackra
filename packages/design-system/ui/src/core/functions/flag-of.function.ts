/**
 * Stackra file contract:
 * Purpose: `flagOf(country)`, the flag emoji of an ISO 3166-1 alpha-2 code, from its two regional indicator letters.
 * Boundary: pure; an empty string for anything that is not two letters.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */

/**
 * The flag of a country.
 * @param country - an ISO 3166-1 alpha-2 code
 * @returns the flag emoji
 */
export function flagOf(country: string): string {
  if (!/^[a-z]{2}$/i.test(country)) return "";
  return String.fromCodePoint(
    ...[...country.toUpperCase()].map((c) => 0x1_f1_e6 + (c.codePointAt(0) ?? 65) - 65),
  );
}
