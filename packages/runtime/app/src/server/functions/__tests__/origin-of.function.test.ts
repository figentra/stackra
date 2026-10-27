/**
 * Stackra file contract:
 * Purpose: unit tests of `originOf`: a referer gives its origin, case and the default port are normalised, and the
 *          opaque `null` origin and a non-URL give `undefined`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437.
 */
import { describe, expect, it } from "@stackra/testing";

import { originOf } from "#server/functions/origin-of.function";

describe("originOf", () => {
  it("reads the origin of a referer, normalised", () => {
    expect(originOf("https://APP.acme.example:443/orders?x=1")).toBe("https://app.acme.example");
  });

  it("gives undefined for the opaque origin and a non-URL", () => {
    expect(originOf("null")).toBeUndefined();
    expect(originOf("not a url")).toBeUndefined();
  });
});
