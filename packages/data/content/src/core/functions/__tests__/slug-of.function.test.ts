/**
 * Stackra file contract:
 * Purpose: unit tests of `slugOf`: Latin and Arabic titles, diacritics and tatweel dropped, separators collapsed, the
 *          length cap, and the refusal of a title with nothing to keep.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0321 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { slugOf } from "#core/functions/slug-of.function";

describe(slugOf, () => {
  it("makes slugs in any script", () => {
    expect(slugOf("  Summer Sale — 2026! ")).toBe("summer-sale-2026");
    expect(slugOf("تَخفيضـات الصيف")).toBe("تخفيضات-الصيف");
    expect(slugOf("x".repeat(130))).toHaveLength(120);
  });

  it("refuses a title with no letter or digit", () => {
    expect(() => slugOf("— !")).toThrow(RangeError);
  });
});
