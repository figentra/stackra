/**
 * Stackra file contract:
 * Purpose: unit tests of `Rules`: `create` registers the sources' fields by path and throws on a misdeclared source;
 *          `fields` and `fieldOf` read them; `problems` names each refused node by its path (unknown field, operator
 *          outside the type's set, unfitting value, malformed node, too deep, too many nodes) and finds nothing in a
 *          valid tree; `check` returns the tree or throws `ConditionInvalidError` with those field errors.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 2, 3, 4 and 10).
 */
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { type FactSource, FieldType, Operator } from "#contracts/index";
import { ConditionInvalidError } from "#core/errors/condition-invalid.error";
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
