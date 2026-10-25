/**
 * Stackra file contract:
 * Purpose: unit tests of `Operator`: its snake_case codes, unique and stable, and the operand shape of each.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decision 3); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Operator } from "#contracts/enums/operator.enum";

describe("Operator", () => {
  it("has 26 snake_case codes", () => {
    const codes = Enum.values(Operator);
    expect(codes).toHaveLength(26);
    expect(new Set(codes).size).toBe(26);
    for (const code of codes) expect(code).toMatch(/^[a-z]+(?:_[a-z]+)*$/);
  });

  it("states the shape of each operator's value", () => {
    expect(Enum.meta(Operator, Operator.IsSet).operand).toBe("none");
    expect(Enum.meta(Operator, Operator.IsEmpty).operand).toBe("none");
    expect(Enum.meta(Operator, Operator.Equals).operand).toBe("one");
    expect(Enum.meta(Operator, Operator.Before).operand).toBe("one");
    expect(Enum.meta(Operator, Operator.OneOf).operand).toBe("many");
    expect(Enum.meta(Operator, Operator.IncludesAll).operand).toBe("many");
    expect(Enum.meta(Operator, Operator.Between).operand).toBe("range");
    expect(Enum.meta(Operator, Operator.WithinLast).operand).toBe("duration");
    expect(Enum.meta(Operator, Operator.WithinRadius).operand).toBe("circle");
  });

  it("keeps the codes saved rules store", () => {
    expect(Operator.NotEquals).toBe("not_equals");
    expect(Operator.AtLeast).toBe("at_least");
    expect(Operator.NotWithinLast).toBe("not_within_last");
    expect(Operator.IsNotSet).toBe("is_not_set");
  });
});
