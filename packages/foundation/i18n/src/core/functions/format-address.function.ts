/**
 * Stackra file contract:
 * Purpose: `formatAddress(address, format, locale)`, an address as printed lines in its Market's order: each layout row
 *          joins its parts with a space, `lines` expands to the street lines, `country` is the country's name in the
 *          reader's language, and empty rows are dropped.
 * Boundary: pure apart from Intl. The layout is the Market's `AddressFormat` (pack data, `@stackra/validation`'s
 *           type); nothing here orders parts for a country.
 * Runtime: isomorphic
 * Governing contract: OS-370 and COM-117 (address formats in the market pack); owner principle 2026-10-25.
 */
import type { Address, AddressFormat } from "@stackra/validation";

import { countryName } from "#core/functions/country-name.function";

/**
 * The printed lines of `address`.
 *
 * @example
 * formatAddress(address, format, "ar"); // ["12 طريق الملك فهد", "الرياض 12345", "السعودية"]
 */
export function formatAddress(address: Address, format: AddressFormat, locale: string): string[] {
  const printed: string[] = [];
  for (const row of format.layout) {
    if (row.length === 1 && row[0] === "lines") {
      printed.push(...address.lines);
      continue;
    }
    const line = row
      .map((part) =>
        part === "country"
          ? countryName(address.country, locale)
          : part === "lines"
            ? address.lines.join(" ")
            : (address[part] ?? ""),
      )
      .filter((value) => value !== "")
      .join(" ");
    if (line !== "") printed.push(line);
  }
  return printed;
}
