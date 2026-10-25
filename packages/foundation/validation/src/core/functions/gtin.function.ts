/**
 * Stackra file contract:
 * Purpose: `gtin()`, the schema of a GTIN field (a product barcode): GTIN-8, -12, -13 or -14 with a correct check
 *          digit, read as GTIN-14 so one product has one key whatever length was scanned.
 * Boundary: spaces are trimmed; anything else that is not a valid GTIN is refused. The output is the zero-padded
 *           GTIN-14 string.
 * Runtime: isomorphic
 * Governing contract: GS1 General Specifications; conflict #1; COM-78; ADR 0305.
 */
import { z } from "zod";
import type { ZodType } from "zod";

import { isGtin } from "#core/functions/is-gtin.function";

/**
 * A new schema of GTINs, normalised to 14 digits.
 *
 * @example
 * gtin().parse("4006381333931"); // "04006381333931"
 */
export function gtin(): ZodType<string, string> {
  return z
    .string()
    .trim()
    .refine(isGtin, "Expected a GTIN with a correct check digit")
    .transform((value) => value.padStart(14, "0"));
}
