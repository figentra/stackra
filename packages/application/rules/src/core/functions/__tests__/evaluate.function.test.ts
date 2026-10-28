/**
 * Stackra file contract:
 * Purpose: unit tests of `evaluate`: the operators of every field type, one reading of a missing fact, a money amount
 *          in another currency, relative dates against the supplied time, great-circle distances, `all`/`any`/`not`
 *          with empty groups, an explanation of every node by path in tree order naming the revision, determinism,
 *          and the refusals: a condition that no longer checks, an invalid time, and a fact of the wrong form.
 * Boundary: test only; pure, no clock: every case passes its own time.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 2, 3, 5, 6 and 7).
 */
import type { Json } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { type FactSource, FieldType, Operator } from "#contracts/index";
import { ConditionInvalidError } from "#core/errors/condition-invalid.error";
import { evaluate } from "#core/functions/evaluate.function";
import type { Condition } from "#core/types/condition.type";
import type { RuleFacts } from "#core/types/rule-facts.type";
import { Rules } from "#core/values/rules.value";

/** A label key. */
const label = "shop::facts.field" as I18nKey;

/** The cart's facts. */
const CART = {
  key: "cart",
  fields: {
    total: { type: FieldType.Money, label },
    items: { type: FieldType.Number, label },
    skus: { type: FieldType.List, label },
  },
} satisfies FactSource;

/** The customer's facts. */
const CUSTOMER = {
  key: "customer",
  fields: {
    email: { type: FieldType.String, label },
    tier: { type: FieldType.Enum, label, values: { gold: label, silver: label } },
    joinedAt: { type: FieldType.Date, label },
    home: { type: FieldType.Geo, label },
    nickname: { type: FieldType.String, label },
  },
} satisfies FactSource;

/** The registry. */
const RULES = Rules.create({ key: "shop.discount", sources: [CART, CUSTOMER] });

/** The time every case evaluates at. */
const NOW = new Date("2026-10-25T12:00:00Z");

/** The facts every case reads. */
const FACTS: RuleFacts = {
  cart: { total: Money.of("120.00", "USD"), items: 3, skus: ["sku_a", "sku_b"] },
  customer: {
    email: "sam@acme.com",
    tier: "gold",
    joinedAt: new Date("2026-10-10T12:00:00Z"),
    home: { latitude: 25.2048, longitude: 55.2708 },
    nickname: null,
  },
};

/** Whether one leaf matches the facts. */
const holds = (field: string, operator: Operator, value?: Json): boolean =>
  evaluate(RULES, value === undefined ? { field, operator } : { field, operator, value }, FACTS, {
    now: NOW,
  }).matched;

/** Dollars as JSON. */
const usd = (minor: number) => ({ minor, currency: "USD" });

describe("evaluate", () => {
  it("tests strings exactly and enums by code", () => {
    expect(holds("customer.email", Operator.EndsWith, "@acme.com")).toBe(true);
    expect(holds("customer.email", Operator.EndsWith, "@ACME.com")).toBe(false);
    expect(holds("customer.email", Operator.StartsWith, "sam")).toBe(true);
    expect(holds("customer.email", Operator.Contains, "@")).toBe(true);
    expect(holds("customer.email", Operator.OneOf, ["a@b.c", "sam@acme.com"])).toBe(true);
    expect(holds("customer.email", Operator.NotEquals, "sam@acme.com")).toBe(false);
    expect(holds("customer.tier", Operator.Equals, "gold")).toBe(true);
    expect(holds("customer.tier", Operator.NotOneOf, ["silver"])).toBe(true);
  });

  it("orders numbers and money, ranges inclusive", () => {
    expect(holds("cart.items", Operator.AtLeast, 3)).toBe(true);
    expect(holds("cart.items", Operator.GreaterThan, 3)).toBe(false);
    expect(holds("cart.items", Operator.Between, [3, 5])).toBe(true);
    expect(holds("cart.items", Operator.Equals, 3)).toBe(true);
    expect(holds("cart.total", Operator.AtLeast, usd(12_000))).toBe(true);
    expect(holds("cart.total", Operator.LessThan, usd(12_000))).toBe(false);
    expect(holds("cart.total", Operator.Between, [usd(10_000), usd(12_000)])).toBe(true);
  });

  it("fails a money test in another currency, and says why", () => {
    const result = evaluate(
      RULES,
      { field: "cart.total", operator: Operator.AtMost, value: { minor: 1, currency: "EUR" } },
      FACTS,
      { now: NOW },
    );
    expect(result.matched).toBe(false);
    expect(result.steps[0]).toMatchObject({ reason: "currency_mismatch" });
    expect(holds("cart.total", Operator.NotEquals, { minor: 1, currency: "EUR" })).toBe(false);
  });

  it("tests dates against the time the caller gives", () => {
    expect(holds("customer.joinedAt", Operator.Before, "2026-10-11T00:00:00Z")).toBe(true);
    expect(holds("customer.joinedAt", Operator.After, "2026-10-11T00:00:00Z")).toBe(false);
    expect(holds("customer.joinedAt", Operator.WithinLast, "30d")).toBe(true);
    expect(holds("customer.joinedAt", Operator.WithinLast, "14d")).toBe(false);
    expect(holds("customer.joinedAt", Operator.WithinLast, "15d")).toBe(true);
    expect(holds("customer.joinedAt", Operator.NotWithinLast, "14d")).toBe(true);
    const later = { now: new Date("2026-12-01T00:00:00Z") };
    const recent: Condition = {
      field: "customer.joinedAt",
      operator: Operator.WithinLast,
      value: "30d",
    };
    expect(evaluate(RULES, recent, FACTS, later).matched).toBe(false);
  });

  it("tests lists and distances", () => {
    expect(holds("cart.skus", Operator.Includes, "sku_a")).toBe(true);
    expect(holds("cart.skus", Operator.IncludesAny, ["sku_x", "sku_b"])).toBe(true);
    expect(holds("cart.skus", Operator.IncludesAll, ["sku_a", "sku_x"])).toBe(false);
    expect(holds("cart.skus", Operator.IncludesNone, ["sku_x"])).toBe(true);
    expect(holds("cart.skus", Operator.IsEmpty)).toBe(false);
    expect(holds("cart.skus", Operator.IsNotEmpty)).toBe(true);
    // Dubai to Abu Dhabi is about 120 km.
    const abuDhabi = { latitude: 24.4539, longitude: 54.3773 };
    expect(
      holds("customer.home", Operator.WithinRadius, { ...abuDhabi, radiusKilometres: 150 }),
    ).toBe(true);
    expect(
      holds("customer.home", Operator.WithinRadius, { ...abuDhabi, radiusKilometres: 100 }),
    ).toBe(false);
    expect(
      holds("customer.home", Operator.OutsideRadius, { ...abuDhabi, radiusKilometres: 100 }),
    ).toBe(true);
  });

  it("reads a missing fact one way: only is_not_set matches it", () => {
    expect(holds("customer.nickname", Operator.IsNotSet)).toBe(true);
    expect(holds("customer.nickname", Operator.IsSet)).toBe(false);
    expect(holds("customer.nickname", Operator.NotEquals, "x")).toBe(false);
    expect(holds("customer.nickname", Operator.NotOneOf, ["x"])).toBe(false);
    const result = evaluate(
      RULES,
      { field: "customer.nickname", operator: Operator.Equals, value: "x" },
      {},
      {
        now: NOW,
      },
    );
    expect(result.steps[0]).toMatchObject({ matched: false, reason: "missing" });
    expect(holds("customer.email", Operator.IsSet)).toBe(true);
  });

  it("combines groups, with an empty all holding and an empty any not", () => {
    const gold: Condition = { field: "customer.tier", operator: Operator.Equals, value: "gold" };
    const big: Condition = { field: "cart.items", operator: Operator.AtLeast, value: 10 };
    const at = { now: NOW };
    expect(evaluate(RULES, { all: [gold, big] }, FACTS, at).matched).toBe(false);
    expect(evaluate(RULES, { any: [gold, big] }, FACTS, at).matched).toBe(true);
    expect(evaluate(RULES, { not: big }, FACTS, at).matched).toBe(true);
    expect(evaluate(RULES, { all: [] }, FACTS, at).matched).toBe(true);
    expect(evaluate(RULES, { any: [] }, FACTS, at).matched).toBe(false);
  });

  it("explains every node by path, root first, and names the revision", () => {
    const condition: Condition = {
      all: [
        { field: "customer.tier", operator: Operator.Equals, value: "gold" },
        { not: { field: "cart.items", operator: Operator.AtLeast, value: 2 } },
      ],
    };
    const result = evaluate(RULES, condition, FACTS, { now: NOW, revision: 4 });
    expect(result).toEqual({
      matched: false,
      revision: 4,
      steps: [
        { path: "", matched: false },
        { path: "all.0", matched: true, field: "customer.tier", operator: Operator.Equals },
        { path: "all.1", matched: false },
        { path: "all.1.not", matched: true, field: "cart.items", operator: Operator.AtLeast },
      ],
    });
    expect(evaluate(RULES, condition, FACTS, { now: NOW }).revision).toBeNull();
  });

  it("gives the same result for the same condition, facts, time and revision", () => {
    const condition: Condition = {
      any: [{ field: "customer.joinedAt", operator: Operator.WithinLast, value: "20d" }],
    };
    const first = evaluate(RULES, condition, FACTS, { now: NOW, revision: 1 });
    expect(evaluate(RULES, condition, FACTS, { now: new Date(NOW), revision: 1 })).toEqual(first);
  });

  it("refuses a condition that no longer checks, a bad time and a fact of the wrong form", () => {
    try {
      evaluate(RULES, { field: "cart.coupon", operator: Operator.IsSet }, FACTS, { now: NOW });
      expect.unreachable();
    } catch (error) {
      expect(isRefusal(error, ConditionInvalidError)).toBe(true);
    }
    const leaf: Condition = { field: "cart.items", operator: Operator.IsSet };
    expect(() => evaluate(RULES, leaf, FACTS, { now: new Date("nope") })).toThrow(TypeError);
    expect(() => evaluate(RULES, leaf, { cart: { items: "3" } }, { now: NOW })).toThrow(TypeError);
    const total: Condition = { field: "cart.total", operator: Operator.AtLeast, value: usd(1) };
    expect(() => evaluate(RULES, total, { cart: { total: 120 } }, { now: NOW })).toThrow(TypeError);
  });
});
