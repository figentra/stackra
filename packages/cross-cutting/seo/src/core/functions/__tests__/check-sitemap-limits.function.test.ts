/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSitemapLimits`: a file at the protocol limits passes, one URL more or one byte more is
 *          refused, and multi-byte text is measured in UTF-8 bytes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { SITEMAP_LIMITS } from "#core/constants/sitemap-limits.constant";
import { checkSitemapLimits } from "#core/functions/check-sitemap-limits.function";

describe("checkSitemapLimits", () => {
  it("states the protocol's ceilings", () => {
    expect(SITEMAP_LIMITS).toEqual({ urls: 50_000, bytes: 52_428_800 });
    expect(Object.isFrozen(SITEMAP_LIMITS)).toBe(true);
  });

  it("returns a file at the URL limit", () => {
    expect(checkSitemapLimits("<urlset/>", 50_000)).toBe("<urlset/>");
  });

  it("refuses one URL more", () => {
    expect(() => checkSitemapLimits("<urlset/>", 50_001)).toThrow(RangeError);
  });

  it("refuses a file above 50 MB and passes one at it", () => {
    expect(checkSitemapLimits("a".repeat(SITEMAP_LIMITS.bytes), 1)).toHaveLength(
      SITEMAP_LIMITS.bytes,
    );
    expect(() => checkSitemapLimits("a".repeat(SITEMAP_LIMITS.bytes + 1), 1)).toThrow(RangeError);
  });

  it("measures UTF-8 bytes, not characters", () => {
    const arabic = "ع".repeat(SITEMAP_LIMITS.bytes / 2 + 1); // two bytes each in UTF-8
    expect(() => checkSitemapLimits(arabic, 1)).toThrow(RangeError);
  });
});
