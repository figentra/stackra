/**
 * Stackra file contract:
 * Purpose: unit tests of `originOf`: an absolute URL gives its origin (port kept, path and query dropped), a relative
 *          one is a `TypeError`.
 * Boundary: test only; plain values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0154 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { originOf } from "#core/functions/origin-of.function";

describe(originOf, () => {
  it("gives a URL's origin and refuses a relative one", () => {
    expect(originOf("https://api.example.com:8443/a?b")).toBe("https://api.example.com:8443");
    expect(() => originOf("/a")).toThrow(TypeError);
  });
});
