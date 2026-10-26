/**
 * Stackra file contract:
 * Purpose: unit tests of `Rules`: `create` registers the sources' fields by path and throws on a misdeclared source;
 *          `fields` and `fieldOf` read them; `problems` names each refused node by its path (unknown field, operator
 *          outside the type's set, unfitting value, malformed node, too deep, too many nodes) and finds nothing in a
 *          valid tree; `check` returns the tree or throws `ConditionInvalidError` with those field errors; outcome
 *          kinds are registered and misdeclared ones throw; `outcomeProblems` names each refused outcome or parameter
 *          and `checkOutcomes` returns the outcomes or throws `OutcomeInvalidError`, also for a parameter past a floor
 *          at save time (`floorProblems`); `conditionSchema` refuses an unregistered field at its node's path.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 2, 3, 4 and 10).
 */
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { type FactSource, FieldType, Operator } from "#contracts/index";
import { ConditionInvalidError } from "#core/errors/condition-invalid.error";
import { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";
import type { Condition } from "#core/types/condition.type";
import { Rules } from "#core/values/rules.value";

/** A label key. */
const label = "shop::facts.field" as I18nKey;

/** The cart's facts. */
const CART = {
  key: "cart",
  fields: {
    total: { type: FieldType.Money, label },
    items: { type: FieldType.Number, label },
  },
} satisfies FactSource;

/** The customer's facts. */
const CUSTOMER = {
  key: "customer",
  fields: {
    email: { type: FieldType.String, label },
    tier: { type: FieldType.Enum, label, values: { gold: label, silver: label } },
  },
} satisfies FactSource;

/** The registry under test. */
const RULES = Rules.create({ key: "shop.discount", sources: [CART, CUSTOMER] });

/** A valid leaf. */
const GOLD: Condition = { field: "customer.tier", operator: Operator.Equals, value: "gold" };

/** A thunk that creates a registry, for `toThrow`. */
const create = (key: string, sources: readonly FactSource[]) => () =>
  Rules.create({ key, sources });

/** A tree `depth` levels deep, a leaf at the bottom. */
const nested = (depth: number): Condition => (depth <= 1 ? GOLD : { all: [nested(depth - 1)] });

describe("Rules", () => {
  it("registers each source's fields by path, in order", () => {
    expect(RULES.key).toBe("shop.discount");
    expect(RULES.sources).toEqual([CART, CUSTOMER]);
    expect(Object.isFrozen(RULES)).toBe(true);
    expect(RULES.fields().map((field) => field.path)).toEqual([
      "cart.total",
      "cart.items",
      "customer.email",
      "customer.tier",
    ]);
    expect(RULES.fieldOf("cart.total")).toBe(CART.fields.total);
    expect(RULES.fieldOf("cart.missing")).toBeUndefined();
  });

  it("throws on a misdeclared consumer or source", () => {
    expect(create("Discount", [CART])).toThrow(TypeError);
    expect(create("shop.discount", [])).toThrow(TypeError);
    expect(create("shop.discount", [CART, CART])).toThrow(TypeError);
    expect(create("shop.discount", [{ key: "Cart", fields: CART.fields }])).toThrow(TypeError);
    expect(create("shop.discount", [{ key: "cart", fields: {} }])).toThrow(TypeError);
    expect(
      create("shop.discount", [{ key: "cart", fields: { "the-total": CART.fields.total } }]),
    ).toThrow(TypeError);
    const enumWithout = { tier: { type: FieldType.Enum, label } };
    const numberWith = { items: { type: FieldType.Number, label, values: { one: label } } };
    const emptyEnum = { tier: { type: FieldType.Enum, label, values: {} } };
    for (const fields of [enumWithout, numberWith, emptyEnum])
      expect(create("shop.discount", [{ key: "cart", fields }])).toThrow(TypeError);
    // @ts-expect-error -- "boolean" is not a FieldType
    const untyped: FactSource = { key: "cart", fields: { paid: { type: "boolean", label } } };
    expect(create("shop.discount", [untyped])).toThrow(TypeError);
  });

  it("finds nothing wrong in a valid tree, empty groups included", () => {
    const tree: Condition = {
      any: [
        { all: [] },
        { not: GOLD },
        { field: "cart.items", operator: Operator.Between, value: [1, 5] },
        { field: "customer.email", operator: Operator.IsSet },
      ],
    };
    expect(RULES.problems(tree)).toEqual({});
    expect(RULES.check(tree)).toBe(tree);
  });

  it("names each refused leaf by its path", () => {
    expect(
      RULES.problems({
        all: [
          { field: "cart.discount", operator: Operator.Equals, value: 1 },
          { field: "customer.email", operator: Operator.LessThan, value: "a" },
          { not: { field: "customer.tier", operator: Operator.Equals, value: "bronze" } },
          { field: "customer.email", operator: Operator.IsSet, value: "x" },
        ],
      }),
    ).toEqual({
      "all.0": "field_unknown",
      "all.1": "operator_not_allowed",
      "all.2.not": "value_invalid",
      "all.3": "value_invalid",
    });
  });

  it("refuses a malformed node, the root as (root)", () => {
    expect(RULES.problems("all")).toEqual({ "(root)": "node_invalid" });
    expect(RULES.problems(null)).toEqual({ "(root)": "node_invalid" });
    expect(RULES.problems([GOLD])).toEqual({ "(root)": "node_invalid" });
    expect(RULES.problems({ all: GOLD })).toEqual({ "(root)": "node_invalid" });
    expect(RULES.problems({ all: [], any: [] })).toEqual({ "(root)": "node_invalid" });
    expect(RULES.problems({ any: [{ ...GOLD, script: "1" }] })).toEqual({
      "any.0": "node_invalid",
    });
    expect(RULES.problems({ any: [{ field: "customer.tier", operator: 1 }] })).toEqual({
      "any.0": "node_invalid",
    });
  });

  it("bounds the depth and the size of a tree", () => {
    expect(RULES.problems(nested(8))).toEqual({});
    expect(RULES.problems(nested(9))).toEqual({
      "all.0.all.0.all.0.all.0.all.0.all.0.all.0.all.0": "too_deep",
    });
    expect(RULES.problems({ any: Array.from({ length: 199 }, () => GOLD) })).toEqual({});
    expect(RULES.problems({ any: Array.from({ length: 200 }, () => GOLD) })).toEqual({
      "(root)": "too_many_nodes",
    });
  });

  it("checks a condition or throws its problems as a refusal", () => {
    expect(RULES.check(GOLD)).toBe(GOLD);
    try {
      RULES.check({ all: [{ field: "cart.discount", operator: Operator.IsSet }] });
      expect.unreachable();
    } catch (error) {
      expect(isRefusal(error, ConditionInvalidError)).toBe(true);
      expect((error as ConditionInvalidError).fieldErrors).toEqual({ "all.0": "field_unknown" });
    }
  });
});

describe("Rules outcome kinds", () => {
  const REFUND = {
    key: "refundWindow",
    label,
    params: {
      days: { type: FieldType.Number, label, floor: "consumer.withdrawal_days" },
      note: { type: FieldType.String, label },
    },
  };
  const HOLD = {
    key: "holdOrder",
    label,
    params: { reason: { type: FieldType.Enum, label, values: { fraud: label } } },
  };
  const RETURNS = Rules.create({ key: "shop.returns", sources: [CART], outcomes: [REFUND, HOLD] });

  it("registers each outcome kind by its key, none when left out", () => {
    expect(RETURNS.outcomeKinds().map((kind) => kind.key)).toEqual(["refundWindow", "holdOrder"]);
    expect(RETURNS.outcomeKind("holdOrder")).toBe(HOLD);
    expect(RULES.outcomeKinds()).toEqual([]);
  });

  it("throws on a misdeclared outcome kind", () => {
    const withKinds = (outcomes: never[]) => () =>
      Rules.create({ key: "shop.returns", sources: [CART], outcomes });
    expect(withKinds([REFUND, REFUND] as never[])).toThrow(/distinct camelCase outcome key/);
    expect(
      withKinds([
        { key: "near", label, params: { at: { type: FieldType.Geo, label } } },
      ] as never[]),
    ).toThrow(/never a geo point/);
    expect(
      withKinds([
        { key: "fee", label, params: { note: { type: FieldType.String, label, floor: "x.y" } } },
      ] as never[]),
    ).toThrow(/only a number or money parameter names a floor/);
  });

  it("finds nothing wrong with registered outcomes and returns them", () => {
    const outcomes = [
      { kind: "refundWindow", params: { days: 30, note: "standard" } },
      { kind: "holdOrder", params: { reason: "fraud" } },
    ];
    expect(RETURNS.outcomeProblems(outcomes)).toEqual({});
    expect(RETURNS.checkOutcomes(outcomes)).toEqual(outcomes);
  });

  it("names each refused outcome and parameter by its path", () => {
    expect(
      RETURNS.outcomeProblems([
        { kind: "refundWindow", params: { days: "thirty", extra: 1 } },
        { kind: "giftWrap", params: {} },
        "hold",
      ]),
    ).toEqual({
      "0.params.days": "value_invalid",
      "0.params.extra": "param_unknown",
      "0.params.note": "param_missing",
      "1": "kind_unknown",
      "2": "node_invalid",
    });
    expect(RETURNS.outcomeProblems({})).toEqual({ "(root)": "node_invalid" });
    expect(RETURNS.outcomeProblems(Array.from({ length: 21 }, () => ({})))).toEqual({
      "(root)": "too_many_outcomes",
    });
  });

  it("refuses invalid outcomes with OutcomeInvalidError", () => {
    expect(() => RETURNS.checkOutcomes([{ kind: "giftWrap", params: {} }])).toThrow(
      OutcomeInvalidError,
    );
  });

  it("refuses an outcome past a floor at save time, and passes one on the right side", () => {
    const floors = [
      {
        key: "consumer.withdrawal_days",
        value: 14,
        market: "eu",
        version: "1.0.0",
        floor: { bound: FloorBound.Min, law: "Directive 2011/83/EU" },
      },
    ] as ResolvedValue[];
    const short = [{ kind: "refundWindow", params: { days: 7, note: "short" } }];
    expect(RETURNS.floorProblems(short, floors)).toEqual({ "0.params.days": "past_floor" });
    try {
      RETURNS.checkOutcomes(short, floors);
      expect.unreachable();
    } catch (error) {
      expect((error as OutcomeInvalidError).fieldErrors).toEqual({ "0.params.days": "past_floor" });
    }
    const long = [{ kind: "refundWindow", params: { days: 30, note: "long" } }];
    expect(RETURNS.checkOutcomes(long, floors)).toEqual(long);
    expect(RETURNS.checkOutcomes(short)).toEqual(short);
  });
});

describe("Rules.conditionSchema", () => {
  it("parses a registered condition and refuses an unknown field at its path", () => {
    const schema = RULES.conditionSchema();
    const tree = { all: [{ field: "cart.discount", operator: Operator.IsSet }] };
    expect(
      schema.safeParse(tree).error?.issues.map((issue) => [issue.path.join("."), issue.message]),
    ).toEqual([["all.0", "field_unknown"]]);
  });
});
