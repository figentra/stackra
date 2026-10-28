/**
 * Stackra file contract:
 * Purpose: unit tests of `checkBudget`: a run that fits is allowed, one over the remainder refused, the warning raised
 *          at the budget's share, and bad counts or shares refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkBudget } from "#core/functions/check-budget.function";

const budget = { limit: 1000, warnAt: 0.8 };

describe("checkBudget", () => {
  it("allows a run that fits and warns from the share", () => {
    expect(checkBudget(100, 100, budget)).toEqual({ allowed: true, warn: false, remaining: 900 });
    expect(checkBudget(700, 100, budget)).toEqual({ allowed: true, warn: true, remaining: 300 });
  });

  it("refuses a run over what remains", () => {
    expect(checkBudget(950, 100, budget)).toEqual({ allowed: false, warn: true, remaining: 50 });
    expect(checkBudget(1200, 0, budget)).toEqual({ allowed: true, warn: true, remaining: 0 });
  });

  it("refuses bad counts and shares", () => {
    expect(() => checkBudget(-1, 0, budget)).toThrow(RangeError);
    expect(() => checkBudget(0, Number.NaN, budget)).toThrow(RangeError);
    expect(() => checkBudget(0, 0, { limit: 1, warnAt: 2 })).toThrow(RangeError);
  });
});
