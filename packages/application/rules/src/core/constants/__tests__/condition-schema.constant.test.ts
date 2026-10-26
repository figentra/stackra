/**
 * Stackra file contract:
 * Purpose: unit tests of `CONDITION_SCHEMA` (`Condition$`): a well-formed tree parses as it is, and a refused tree
 *          reports each problem at its node's path with the snake_case code and never the value.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decision 10); ADR 0425 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { CONDITION_SCHEMA } from "#core/constants/condition-schema.constant";

describe("Condition$", () => {
  it("parses a well-formed tree as it is", () => {
    const tree = { all: [{ field: "customer.tier", operator: "equals", value: "gold" }] };
    expect(CONDITION_SCHEMA.parse(tree)).toEqual(tree);
  });

  it("reports each refused node at its path without its value", () => {
    const result = CONDITION_SCHEMA.safeParse({
      any: [{ field: "customer.tier", operator: "eval", value: "secret-value" }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => [issue.path.join("."), issue.message])).toEqual([
      ["any.0", "operator_not_allowed"],
    ]);
    expect(JSON.stringify(result.error?.issues)).not.toContain("secret-value");
  });
});
