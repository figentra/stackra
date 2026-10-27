/**
 * Stackra file contract:
 * Purpose: unit tests of `packRuleSetOf`: a pack's default rule set is read with no scope and checked against its
 *          consumer's `Rules`, and `decide` takes it; a missing template, another consumer's template, a template that
 *          does not check and a document that is not a pack are refused.
 * Boundary: test only; pure. The pack is a made-up fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; config-model section 4; ADR 0455 (decision 1).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { ZodError } from "zod";

import { FieldType, Operator } from "#contracts/index";
import { ConditionInvalidError } from "#core/errors/condition-invalid.error";
import { decide } from "#core/functions/decide.function";
import { packRuleSetOf } from "#core/functions/pack-rule-set-of.function";
import { Rules } from "#core/values/rules.value";

const label = "shop::facts.field" as I18nKey;

const RETURNS = Rules.create({
  key: "shop.returns",
  sources: [{ key: "order", fields: { items: { type: FieldType.Number, label } } }],
  outcomes: [{ key: "refundWindow", label, params: { days: { type: FieldType.Number, label } } }],
});

const PACK = {
  key: "shop.defaults",
  version: "1.2.0",
  ruleSets: [
    {
      key: "shop.returns.window",
      consumer: "shop.returns",
      condition: { field: "order.items", operator: Operator.AtLeast, value: 1 },
      outcomes: [{ kind: "refundWindow", params: { days: 30 } }],
    },
    { key: "shop.other", consumer: "shop.other", condition: { all: [] } },
    {
      key: "shop.returns.broken",
      consumer: "shop.returns",
      condition: { field: "order.nope", operator: Operator.Equals, value: 1 },
    },
  ],
};

describe(packRuleSetOf, () => {
  it("reads a pack's default rule set with no scope, ready for decide", () => {
    const rule = packRuleSetOf(PACK, "shop.returns.window", RETURNS);
    expect(rule.outcomes).toEqual([{ kind: "refundWindow", params: { days: 30 } }]);
    const decision = decide(
      RETURNS,
      rule,
      { order: { items: 2 } },
      { now: new Date(0), floors: [] },
    );
    expect(decision.matched).toBe(true);
    expect(decision.outcomes).toEqual(rule.outcomes);
  });

  it("refuses a missing template, another consumer's, one that does not check, and a non-pack", () => {
    expect(() => packRuleSetOf(PACK, "shop.none", RETURNS)).toThrow(TypeError);
    expect(() => packRuleSetOf(PACK, "shop.other", RETURNS)).toThrow(TypeError);
    expect(() => packRuleSetOf(PACK, "shop.returns.broken", RETURNS)).toThrow(
      ConditionInvalidError,
    );
    expect(() => packRuleSetOf({ key: "x" }, "shop.returns.window", RETURNS)).toThrow(ZodError);
  });
});
