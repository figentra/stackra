/**
 * Stackra file contract:
 * Purpose: unit and type tests of `definePackage`: it returns `{}` unchanged and refuses any option, since gen derives
 *          every fact of a package.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0295 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { definePackage } from "#core/functions/define-package.function";

describe("definePackage", () => {
  it("returns the empty definition unchanged", () => {
    const definition = {};
    expect(definePackage(definition)).toBe(definition);
  });

  it("refuses a derived fact restated", () => {
    // @ts-expect-error -- the member key comes from the package name
    const withKey = definePackage({ key: "loyalty_kit" });
    expect(withKey).toEqual({ key: "loyalty_kit" });
  });
});
