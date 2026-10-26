/**
 * Stackra file contract:
 * Purpose: unit tests of `NATIONAL_ID_FORMATS_SCHEMA` (`NationalIdFormats$`): a pack value of kind codes to formats
 *          parses; a kind that is not snake_case and a bad format are refused.
 * Boundary: test only; pure. The formats are test data shaped like a market pack's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0231; STA-1269.
 */
import { describe, expect, it } from "@stackra/testing";

import { NATIONAL_ID_FORMATS_SCHEMA } from "#core/constants/national-id-formats-schema.constant";

describe("NationalIdFormats$", () => {
  it("parses kind codes to formats", () => {
    const value = {
      national_id: { pattern: "^1\\d{9}$", check: "luhn" },
      residence_permit: { pattern: "^2\\d{9}$", check: "luhn" },
    };
    expect(NATIONAL_ID_FORMATS_SCHEMA.parse(value)).toEqual(value);
  });

  it("refuses a bad kind code or format", () => {
    expect(NATIONAL_ID_FORMATS_SCHEMA.safeParse({ NationalId: { pattern: "^\\d$" } }).success).toBe(
      false,
    );
    expect(NATIONAL_ID_FORMATS_SCHEMA.safeParse({ national_id: { check: "luhn" } }).success).toBe(
      false,
    );
  });
});
