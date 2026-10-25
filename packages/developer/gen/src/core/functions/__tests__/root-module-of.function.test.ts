/**
 * Stackra file contract:
 * Purpose: unit tests of `rootModuleOf`: an authored root module wins, a member without one gets the generated
 *          `<Key>Module`, and a package with nothing for the container ships none.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 15 and 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { rootModuleOf } from "#core/functions/root-module-of.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("rootModuleOf", () => {
  it("generates `<Key>Module` when none is authored", () => {
    expect(rootModuleOf(COMMERCE_IR)).toEqual({
      name: "CommerceModule",
      from: "#stackra/module",
      generated: true,
    });
    expect(rootModuleOf(LOYALTY_KIT_IR)?.name).toBe("LoyaltyKitModule");
  });

  it("uses the authored root module", () => {
    const rootModule = { name: "CommerceModule", from: "#src/commerce.module" };
    expect(rootModuleOf({ ...COMMERCE_IR, rootModule })).toEqual({
      ...rootModule,
      generated: false,
    });
  });

  it("gives a package of values only no module", () => {
    expect(rootModuleOf({ ...LOYALTY_KIT_IR, classes: [] })).toBeUndefined();
    expect(rootModuleOf({ ...COMMERCE_IR, classes: [] })?.generated).toBe(true);
  });
});
