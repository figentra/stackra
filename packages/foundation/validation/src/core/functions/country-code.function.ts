/**
 * Stackra file contract:
 * Purpose: `countryCode()`, the schema of a country field: two letters, upper-cased, that Intl knows as a region.
 * Boundary: the region list is the host's Intl data (`Intl.DisplayNames`), not a table here; a code Intl does not
 *           know is refused.
 * Runtime: isomorphic
 * Governing contract: ISO 3166-1; ADR 0305.
 */
import { z } from "zod";
import type { ZodType } from "zod";

import type { CountryCode } from "#core/types/country-code.type";

/** Region names, used only to ask whether a code is a known region. */
const REGIONS = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

/**
 * A new schema of country codes.
 *
 * @example
 * countryCode().parse("sa"); // "SA"
 */
export function countryCode(): ZodType<CountryCode, string> {
  return z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => /^[A-Z]{2}$/.test(value) && REGIONS.of(value) !== undefined,
      "Expected an ISO 3166-1 alpha-2 country code",
    ) as unknown as ZodType<CountryCode, string>;
}
