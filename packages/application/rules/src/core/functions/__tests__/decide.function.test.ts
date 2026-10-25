/**
 * Stackra file contract:
 * Purpose: unit tests of `decide`: a matching rule yields its outcomes guarded against the floors, with the evaluation
 *          naming the revision; a rule that does not match yields none and never checks its outcomes; a stored outcome
 *          that no longer checks is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decisions 6, 7 and 9); config-model section 4.
 */
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { FieldType, Operator } from "#contracts/index";
import { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";
import { decide } from "#core/functions/decide.function";
import type { RuleDocument } from "#core/types/rule-document.type";
import { Rules } from "#core/values/rules.value";

const label = "shop::label" as I18nKey;

const RULES = Rules.create({
  key: "shop.returns",
  sources: [{ key: "order", fields: { items: { type: FieldType.Number, label } } }],
  outcomes: [
    {
      key: "refundWindow",
      label,
      params: { days: { type: FieldType.Number, label, floor: "consumer.withdrawal_days" } },
    },
  ],
});

const FLOORS = [
  {
    key: "consumer.withdrawal_days",
    value: 14,
    market: "eu",
    version: "1.0.0",
    floor: { bound: FloorBound.Min, law: "Directive 2011/83/EU" },
  },
] as ResolvedValue[];

const RULE: RuleDocument = {
  condition: { field: "order.items", operator: Operator.AtLeast, value: 1 },
  outcomes: [{ kind: "refundWindow", params: { days: 10 } }],
};

const now = new Date("2026-10-25T09:00:00Z");

describe(decide, () => {
  it("yields the guarded outcomes of a matching rule", () => {
    const decision = decide(
      RULES,
      RULE,
      { order: { items: 2 } },
      { now, revision: 3, floors: FLOORS },
    );
    expect(decision.matched).toBe(true);
    expect(decision.evaluation.revision).toBe(3);
    expect(decision.outcomes).toEqual([{ kind: "refundWindow", params: { days: 14 } }]);
    expect(decision.floored).toHaveLength(1);
  });

  it("yields nothing for a rule that does not match", () => {
    const stale = { ...RULE, outcomes: [{ kind: "gone", params: {} }] };
    const decision = decide(RULES, stale, { order: { items: 0 } }, { now, floors: FLOORS });
    expect(decision).toMatchObject({ matched: false, outcomes: [], floored: [] });
  });

  it("refuses a stored outcome that no longer checks", () => {
    const stale = { ...RULE, outcomes: [{ kind: "gone", params: {} }] };
    let refused: unknown;
    try {
      decide(RULES, stale, { order: { items: 2 } }, { now, floors: [] });
    } catch (error) {
      refused = error;
    }
    expect(isRefusal(refused, OutcomeInvalidError)).toBe(true);
  });
});
