/**
 * Stackra file contract:
 * Purpose: unit tests of `RuleOutcome`: a declared outcome kind records its options, `Rules.create` takes the class
 *          as it takes the data form, and a bad key or a class of another kind is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decision 9); ADR 0425 (decision 1).
 */
import { kindOf } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { FieldType } from "#contracts/index";
import { RuleOutcome } from "#core/bases/rule-outcome.base";
import { Rules } from "#core/values/rules.value";

const label = "returns::label" as I18nKey;

class RefundWindow extends RuleOutcome({
  key: "refundWindow",
  label,
  params: { days: { type: FieldType.Number, label, floor: "consumer.withdrawal_days" } },
}) {}

const ORDER = { key: "order", fields: { total: { type: FieldType.Number, label } } };

describe("RuleOutcome", () => {
  it("records the declared kind", () => {
    expect(kindOf(RefundWindow)).toMatchObject({
      kind: "rule_outcome",
      options: { key: "refundWindow", label },
    });
  });

  it("registers with Rules.create as the data form does", () => {
    const rules = Rules.create({ key: "shop.returns", sources: [ORDER], outcomes: [RefundWindow] });
    expect(rules.outcomeKind("refundWindow")?.params["days"]?.floor).toBe(
      "consumer.withdrawal_days",
    );
  });

  it("refuses a bad key and a class of another kind", () => {
    expect(() => RuleOutcome({ key: "refund-window", label, params: {} })).toThrow(TypeError);
    class Plain {}
    expect(() =>
      Rules.create({
        key: "shop.returns",
        sources: [ORDER],
        // @ts-expect-error -- a plain class is not a declared outcome kind
        outcomes: [Plain],
      }),
    ).toThrow(TypeError);
  });
});
