/**
 * Stackra file contract:
 * Purpose: unit tests of `conditionProblems` without a registry: a well-formed tree passes, and a bad shape, a field
 *          that is not a `<source>.<field>` path, an unknown operator, a tree too deep and one too large are refused
 *          by node path.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decisions 2, 3 and 10); ADR 0425 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { conditionProblems } from "#core/functions/condition-problems.function";

const LEAF = { field: "cart.total", operator: "at_least", value: 3 };

/** A tree of `depth` levels of `all` over one leaf. */
const nested = (depth: number): unknown => (depth <= 1 ? LEAF : { all: [nested(depth - 1)] });

describe(conditionProblems, () => {
  it("passes a well-formed tree", () => {
    expect(conditionProblems({ any: [LEAF, { not: LEAF }] })).toEqual({});
  });

  it("refuses a bad field path, an unknown operator and a bad node", () => {
    expect(
      conditionProblems({
        all: [
          { ...LEAF, field: "total" },
          { ...LEAF, operator: "matches" },
          { ...LEAF, script: "1" },
        ],
      }),
    ).toEqual({
      "all.0": "field_unknown",
      "all.1": "operator_not_allowed",
      "all.2": "node_invalid",
    });
  });

  it("bounds depth and size", () => {
    expect(conditionProblems(nested(8))).toEqual({});
    expect(Object.values(conditionProblems(nested(9)))).toEqual(["too_deep"]);
    expect(conditionProblems({ any: Array.from({ length: 200 }, () => LEAF) })).toEqual({
      "(root)": "too_many_nodes",
    });
  });
});
