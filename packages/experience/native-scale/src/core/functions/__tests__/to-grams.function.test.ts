/**
 * Stackra file contract:
 * Purpose: proves `toGrams` converts each display unit to grams exactly, case-insensitively, and answers null for a
 *          unit with no gram value or a value that is not finite.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0253.
 */
import { describe, expect, it } from "@stackra/testing";

import { toGrams } from "#core/functions/to-grams.function";

describe("toGrams", () => {
  it("converts each unit", () => {
    expect(toGrams(250, "g")).toBe(250);
    expect(toGrams(1.25, "kg")).toBe(1250);
    expect(toGrams(1.25, "KG")).toBe(1250);
    expect(toGrams(500, "mg")).toBe(0.5);
    expect(toGrams(2, "lb")).toBe(907.1847);
    expect(toGrams(1, "oz")).toBe(28.3495);
    expect(toGrams(5, "ct")).toBe(1);
    expect(toGrams(-1.2, "g")).toBe(-1.2);
  });

  it("answers null for pieces, percent and non-finite values", () => {
    expect(toGrams(12, "PC")).toBeNull();
    expect(toGrams(50, "%")).toBeNull();
    expect(toGrams(Number.NaN, "g")).toBeNull();
  });
});
