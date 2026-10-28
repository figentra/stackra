/**
 * Stackra file contract:
 * Purpose: unit tests of `adClickIdOf`: the first known click id parameter of a landing URL with its value, a host's
 *          own parameter list, and `null` for no id, a blank id or a malformed URL.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0355 (decision 1); analytics gap 12 (stackra-412).
 */
import { describe, expect, it } from "@stackra/testing";

import { adClickIdOf } from "#core/functions/ad-click-id-of.function";

describe(adClickIdOf, () => {
  it("reads the first known click id by the parameter order", () => {
    expect(adClickIdOf("https://shop.example/p?gclid=Cj0K&fbclid=IwAR")).toEqual({
      param: "fbclid",
      id: "IwAR",
    });
    expect(adClickIdOf("https://shop.example/?ScCid=snap1")).toEqual({
      param: "ScCid",
      id: "snap1",
    });
  });

  it("takes a host's own parameters", () => {
    expect(adClickIdOf("https://shop.example/?msclkid=m1", ["msclkid"])).toEqual({
      param: "msclkid",
      id: "m1",
    });
  });

  it.each([
    ["no click id", "https://shop.example/?utm_source=x"],
    ["a blank click id", "https://shop.example/?gclid=%20"],
    ["a malformed URL", "not a url"],
  ])("answers null for %s", (_case, url) => {
    expect(adClickIdOf(url)).toBeNull();
  });
});
