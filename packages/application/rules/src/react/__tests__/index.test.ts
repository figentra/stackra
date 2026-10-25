/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./react` entry of @stackra/rules: `RuleBuilder` at run time and its props type at
 *          compile time, and none of the `.` entry's symbols.
 * Boundary: test only; the builder itself is tested beside it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0331 (decision 8).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { Condition, Rules } from "#core/index";
import * as react from "#react/index";
import type { RuleBuilderProps } from "#react/index";

describe("@stackra/rules/react", () => {
  it("exports exactly the rule builder", () => {
    expect(Object.keys(react)).toEqual(["RuleBuilder"]);
    expect(Object.keys(react).filter((name) => name in core)).toEqual([]);
  });

  it("types the builder's props", () => {
    expectTypeOf<RuleBuilderProps["rules"]>().toEqualTypeOf<Rules>();
    expectTypeOf<RuleBuilderProps["value"]>().toEqualTypeOf<Condition>();
    expectTypeOf<RuleBuilderProps["onChange"]>().toEqualTypeOf<(next: Condition) => void>();
  });
});
