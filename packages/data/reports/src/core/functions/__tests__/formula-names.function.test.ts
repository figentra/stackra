/**
 * Stackra file contract:
 * Purpose: unit tests of `formulaNames`: the closed grammar parses arithmetic over measure names and returns each name
 *          once in first-use order; function calls, field paths, SQL, unknown operators, unbalanced parentheses and
 *          empty or over-long formulas are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 2); ADR 0154.
 */
import { describe, expect, it } from "@stackra/testing";

import { formulaNames } from "#core/functions/formula-names.function";

describe("formulaNames", () => {
  it("returns the measure names of a formula in first-use order", () => {
    expect(formulaNames("(paid - refunded) / orders")).toEqual(["paid", "refunded", "orders"]);
    expect(formulaNames("revenue / orders * 100")).toEqual(["revenue", "orders"]);
    expect(formulaNames("-a + a * 2.5")).toEqual(["a"]);
    expect(formulaNames("42")).toEqual([]);
  });

  it.each([
    "",
    "   ",
    "sum(total)",
    "customer.country",
    "a; drop table orders",
    "a % b",
    "(a + b",
    "a + b)",
    "a b",
    "a +",
    "2abc",
    "A + b",
    "x".repeat(501),
  ])("refuses %j", (formula) => {
    expect(() => formulaNames(formula)).toThrow(TypeError);
  });
});
