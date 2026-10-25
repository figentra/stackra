/**
 * Stackra file contract:
 * Purpose: unit tests of `normalizePrefix`: the empty prefix lists everything, a trailing `/` is kept, and a prefix
 *          that reaches outside the disk is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizePrefix } from "#core/functions/normalize-prefix.function";

describe("normalizePrefix", () => {
  it("keeps the empty prefix empty", () => {
    expect(normalizePrefix("")).toBe("");
    expect(normalizePrefix("/")).toBe("");
  });

  it("keeps a trailing slash and normalises the rest", () => {
    expect(normalizePrefix("/images//2026/")).toBe("images/2026/");
    expect(normalizePrefix("images")).toBe("images");
  });

  it("refuses a prefix outside the disk", () => {
    expect(() => normalizePrefix("../")).toThrow(RangeError);
  });
});
