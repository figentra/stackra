/**
 * Stackra file contract:
 * Purpose: unit tests of `CUSTOM_FIELD_VALUE_SCHEMA` (`CustomFieldValue$`): each stored form parses, and an object or
 *          a list of numbers is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { CUSTOM_FIELD_VALUE_SCHEMA } from "#core/constants/custom-field-value-schema.constant";

describe("CustomFieldValue$", () => {
  it("parses each stored form", () => {
    for (const value of ["42", 42, true, ["red", "blue"]])
      expect(CUSTOM_FIELD_VALUE_SCHEMA.parse(value)).toEqual(value);
  });

  it("refuses an object or a list of numbers", () => {
    expect(CUSTOM_FIELD_VALUE_SCHEMA.safeParse({ size: 42 }).success).toBe(false);
    expect(CUSTOM_FIELD_VALUE_SCHEMA.safeParse([1, 2]).success).toBe(false);
  });
});
