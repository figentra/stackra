/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Flag` kind base: the template's two flags (a release switch and an expiring
 *          experiment) record their options with the defaults filled in, a bad expiry or an empty scope list is
 *          refused at declaration, and the kind is called only.
 * Boundary: test only; the flags restate the template's `apps/web/src/flags/*.flag.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     25); ADR 0307 (decision 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Flag } from "#core/bases/flag.base";
import type { FlagClass } from "#core/types/flag-class.type";

class HelpCentreFlag extends Flag({
  default: false,
}) {}

class PricingYearlyFirstFlag extends Flag({
  default: false,
  expires: "2027-03-31",
}) {}

class QuickOrderFlag extends Flag({
  default: true,
  expires: "2027-06-30",
  removalIssue: "STA-412",
  scopes: ["platform", "tenant", "user"],
}) {}

describe("Flag", () => {
  it("records a release switch with the defaults filled in", () => {
    expect(kindOf(HelpCentreFlag)).toEqual({
      kind: "flag",
      options: {
        default: false,
        expires: null,
        removalIssue: null,
        scopes: ["platform", "tenant"],
      },
    });
  });

  it("records an expiry, a removal issue and scopes as given", () => {
    expect(kindOf(PricingYearlyFirstFlag)?.options).toMatchObject({ expires: "2027-03-31" });
    expect(kindOf(QuickOrderFlag)?.options).toEqual({
      default: true,
      expires: "2027-06-30",
      removalIssue: "STA-412",
      scopes: ["platform", "tenant", "user"],
    });
  });

  it("keeps instanceof and a class per call", () => {
    expect(new HelpCentreFlag()).toBeInstanceOf(Flag);
    expect(Object.getPrototypeOf(HelpCentreFlag)).not.toBe(Object.getPrototypeOf(QuickOrderFlag));
    expect((Flag as unknown as { name: string }).name).toBe("Flag");
  });

  it("refuses an expiry that is not a real day", () => {
    expect(() => Flag({ default: false, expires: "31/03/2027" })).toThrow(RangeError);
    expect(() => Flag({ default: false, expires: "2027-02-30" })).toThrow(/YYYY-MM-DD/);
    expect(() => Flag({ default: false, expires: "2027-13-01" })).toThrow(RangeError);
  });

  it("refuses an empty scope list", () => {
    expect(() => Flag({ default: false, scopes: [] })).toThrow(/at least one scope/);
  });

  it("is called only and returns a flag class", () => {
    expectTypeOf(Flag({ default: true })).toEqualTypeOf<FlagClass>();
    // @ts-expect-error -- `default` is required
    expect(() => Flag({})).not.toThrow();
    // @ts-expect-error -- not a scope code
    expect(() => Flag({ default: true, scopes: ["market"] })).not.toThrow();
  });
});
