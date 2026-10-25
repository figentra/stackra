/**
 * Stackra file contract:
 * Purpose: pins the exports of the `.` entry of @stackra/rules: `Rules`, `evaluate`, the two refusals and
 *          `RuleSetPublished` at run time, none of `./contracts`' symbols, and the condition, fact and evaluation
 *          types at compile time (a tree and an evaluation typecheck; an abbreviated leaf key and an unknown
 *          operator are refused).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15: one symbol, one entry); ADR 0331 (decisions 2, 6 and 7).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import { Operator } from "#contracts/index";
import * as core from "#core/index";
import type {
  Condition,
  EvaluateOptions,
  Evaluation,
  EvaluationStep,
  FactValue,
  Facts,
  RuleField,
  RulesOptions,
} from "#core/index";

describe("@stackra/rules", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "ConditionInvalidError",
      "RuleSetChangedError",
      "RuleSetPublished",
      "Rules",
      "evaluate",
    ]);
  });

  it("shares no symbol with ./contracts", () => {
    expect(Object.keys(core).filter((name) => name in contracts)).toEqual([]);
  });

  it("types a condition tree as data", () => {
    const tree: Condition = {
      all: [
        { field: "cart.items", operator: Operator.AtLeast, value: 2 },
        { not: { field: "customer.tags", operator: Operator.IsEmpty } },
      ],
    };
    // @ts-expect-error -- a leaf names its operator in a whole word
    const short: Condition = { field: "cart.items", op: Operator.AtLeast, value: 2 };
    // @ts-expect-error -- an operator outside the engine's set
    const unknown: Condition = { field: "cart.items", operator: "matches", value: ".*" };
    expect([tree, short, unknown]).toHaveLength(3);
  });

  it("types the facts, the options and the result", () => {
    expectTypeOf<Facts["cart"]>().toEqualTypeOf<
      Readonly<Record<string, FactValue | null | undefined>>
    >();
    expectTypeOf<EvaluateOptions["now"]>().toEqualTypeOf<Date>();
    expectTypeOf<Evaluation["revision"]>().toEqualTypeOf<number | null>();
    expectTypeOf<EvaluationStep["reason"]>().toEqualTypeOf<
      "missing" | "currency_mismatch" | undefined
    >();
    expectTypeOf<RuleField["path"]>().toEqualTypeOf<string>();
    expectTypeOf<RulesOptions["key"]>().toEqualTypeOf<string>();
  });
});
