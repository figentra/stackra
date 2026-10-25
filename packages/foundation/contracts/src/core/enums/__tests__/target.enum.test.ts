/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Target`: an `Enum.of` whose codes, order and case names are the contract (ADR 0249 and 0295).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { Target } from "#core/enums/target.enum";

describe("Target", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(Target)).toEqual(["web", "pwa", "desktop", "ios", "android"]);
  });

  it("is a frozen Enum.of value whose case names are the PascalCase of the codes", () => {
    expect(Object.isFrozen(Target)).toBe(true);
    // the type also names the type-only `~enum` map, which is never an own key at runtime
    for (const [caseName, code] of Object.entries(Target) as [string, string][])
      expect(caseName.toLowerCase()).toBe(code.replaceAll("_", "").toLowerCase());
  });

  it("writes every code in snake_case", () => {
    for (const code of Enum.values(Target)) expect(code).toMatch(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
  });

  it("has a type of the same name that refuses other strings", () => {
    const code: Target = Target.Web;
    // @ts-expect-error -- not a code of Target
    const wrong: Target = "not_a_code";
    expect([code, wrong]).toEqual([Target.Web, "not_a_code"]);
  });
});
