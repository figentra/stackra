/**
 * Stackra file contract:
 * Purpose: unit and type tests of `flagRefs`: the web template's generated tree of declared classes (keys and label
 *          keys derived from the tree names, options from the class), the mobile template's written-out consumed
 *          flag (its fields kept, the missing ones defaulted), frozen output, typed keys, and a refused non-flag.
 * Boundary: test only; the trees restate the template's `apps/{web,mobile}/.stackra/gen/flags.ts`, with the scope
 *           codes as strings since settings sits above this package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 20); ADR 0307 (decision 25).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Flag } from "#core/bases/flag.base";
import { flagRefs } from "#core/functions/flag-refs.function";
import type { FlagRef } from "#core/types/flag-ref.type";

class HelpCentreFlag extends Flag({ default: false }) {}

class PricingYearlyFirstFlag extends Flag({
  default: false,
  expires: "2027-03-31",
}) {}

const Flags = flagRefs({
  web: { pricing_yearly_first: PricingYearlyFirstFlag, help_centre: HelpCentreFlag },
  orders: {
    quick_order: {
      key: "orders.quick_order",
      default: true,
      scopes: ["platform", "tenant"],
      expires: "2027-06-30",
      label: "orders::flags.quick_order.label",
    },
  },
});

describe("flagRefs", () => {
  it("derives a declared flag's key and label from the tree and reads its options", () => {
    expect(Flags.web.help_centre).toEqual({
      key: "web.help_centre",
      default: false,
      scopes: ["platform", "tenant"],
      expires: null,
      removalIssue: null,
      label: "web::flags.help_centre.label",
    });
    expect(Flags.web.pricing_yearly_first.expires).toBe("2027-03-31");
  });

  it("keeps a written-out flag and defaults what it leaves out", () => {
    expect(Flags.orders.quick_order).toEqual({
      key: "orders.quick_order",
      default: true,
      scopes: ["platform", "tenant"],
      expires: "2027-06-30",
      removalIssue: null,
      label: "orders::flags.quick_order.label",
    });
    const [ref] = Object.values(
      flagRefs({ shop: { beta: { key: "shop.beta", default: false } } }).shop,
    );
    expect(ref).toMatchObject({ scopes: ["platform", "tenant"], label: "shop::flags.beta.label" });
  });

  it("returns frozen references", () => {
    expect(Object.isFrozen(Flags)).toBe(true);
    expect(Object.isFrozen(Flags.web)).toBe(true);
    expect(Object.isFrozen(Flags.web.help_centre)).toBe(true);
  });

  it("types each key", () => {
    expectTypeOf(Flags.web.help_centre).toEqualTypeOf<FlagRef<"web.help_centre">>();
    expectTypeOf(Flags.orders.quick_order).toEqualTypeOf<FlagRef<"orders.quick_order">>();
  });

  it("refuses a class that is not a flag", () => {
    class NotAFlag {}
    // @ts-expect-error -- not a flag class
    expect(() => flagRefs({ web: { other: NotAFlag } })).toThrow(/web\.other is not a flag/);
  });
});
