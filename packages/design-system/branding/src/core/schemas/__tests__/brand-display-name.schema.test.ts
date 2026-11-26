/**
 * Stackra file contract:
 * Purpose: unit tests of `BrandDisplayName`: both names default to unset, and a name over 80 characters is refused.
 * Boundary: test only; parses through the registered schema.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { validate } from "@stackra/validation";

import { BrandDisplayName } from "#core/schemas/brand-display-name.schema";

/** The display-name section. */
describe("BrandDisplayName", () => {
  /** Unset in both locales by default. */
  it("defaults both names to null", () => {
    const parsed = validate(BrandDisplayName, {});
    expect(parsed.success && parsed.data).toEqual({ en: null, ar: null });
  });

  /** Eighty characters is the limit. */
  it("takes 80 characters and refuses 81", () => {
    expect(validate(BrandDisplayName, { en: "x".repeat(80) }).success).toBe(true);
    expect(validate(BrandDisplayName, { ar: "x".repeat(81) }).success).toBe(false);
  });
});
