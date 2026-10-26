/**
 * Stackra file contract:
 * Purpose: unit tests of `guardFloors`: a parameter below a `min` floor or above a `max` floor is lifted to it and
 *          reported with its law, market and version; one on the right side, one without a floor in the market and an
 *          unfloored parameter stay as they are; a floor whose pack value is not a number and an unregistered kind
 *          throw.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; config-model sections 3 and 4; ADR 0370 (decision 6).
 */
import type { I18nKey } from "@stackra/i18n";
import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { FieldType } from "#contracts/index";
import { guardFloors } from "#core/functions/guard-floors.function";
import { Rules } from "#core/values/rules.value";

const label = "shop::label" as I18nKey;

const RULES = Rules.create({
  key: "shop.returns",
  sources: [{ key: "order", fields: { total: { type: FieldType.Number, label } } }],
  outcomes: [
    {
      key: "refundWindow",
      label,
      params: { days: { type: FieldType.Number, label, floor: "consumer.withdrawal_days" } },
    },
    {
      key: "deposit",
      label,
      params: {
        percent: { type: FieldType.Number, label, floor: "consumer.deposit_cap_percent" },
        note: { type: FieldType.String, label },
      },
    },
    {
      key: "fee",
      label,
      params: { amount: { type: FieldType.Money, label, floor: "consumer.fee_cap" } },
    },
  ],
});

/** A floor of the `eu` pack. */
const floor = (key: string, value: unknown, bound: FloorBound): ResolvedValue =>
  ({
    key,
    value,
    market: "eu",
    version: "1.0.0",
    floor: { bound, law: "Directive 2011/83/EU" },
  }) as ResolvedValue;

const FLOORS = [
  floor("consumer.withdrawal_days", 14, FloorBound.Min),
  floor("consumer.deposit_cap_percent", 20, FloorBound.Max),
];

describe(guardFloors, () => {
  it("lifts a parameter that crosses a floor and reports it", () => {
    const guarded = guardFloors(
      RULES,
      [
        { kind: "refundWindow", params: { days: 7 } },
        { kind: "deposit", params: { percent: 50, note: "peak" } },
      ],
      FLOORS,
    );
    expect(guarded.outcomes).toEqual([
      { kind: "refundWindow", params: { days: 14 } },
      { kind: "deposit", params: { percent: 20, note: "peak" } },
    ]);
    expect(guarded.floored).toEqual([
      {
        kind: "refundWindow",
        param: "days",
        from: 7,
        to: 14,
        law: "Directive 2011/83/EU",
        market: "eu",
        version: "1.0.0",
      },
      {
        kind: "deposit",
        param: "percent",
        from: 50,
        to: 20,
        law: "Directive 2011/83/EU",
        market: "eu",
        version: "1.0.0",
      },
    ]);
  });

  it("leaves a value on the right side, and one the market has no floor for", () => {
    const outcomes = [{ kind: "refundWindow", params: { days: 30 } }];
    expect(guardFloors(RULES, outcomes, FLOORS)).toEqual({ outcomes, floored: [] });
    const lower = [{ kind: "refundWindow", params: { days: 3 } }];
    expect(guardFloors(RULES, lower, []).outcomes).toEqual(lower);
  });

  it("moves a money amount past a money floor, or in another currency, to the floor", () => {
    const cap = [floor("consumer.fee_cap", { minor: 5_000, currency: "EUR" }, FloorBound.Max)];
    const over = guardFloors(
      RULES,
      [{ kind: "fee", params: { amount: { minor: 9_000, currency: "EUR" } } }],
      cap,
    );
    expect(over.outcomes).toEqual([
      { kind: "fee", params: { amount: { minor: 5_000, currency: "EUR" } } },
    ]);
    expect(over.floored[0]).toMatchObject({
      from: { minor: 9_000, currency: "EUR" },
      to: { minor: 5_000, currency: "EUR" },
    });
    const foreign = guardFloors(
      RULES,
      [{ kind: "fee", params: { amount: { minor: 100, currency: "USD" } } }],
      cap,
    );
    expect(foreign.outcomes[0]?.params["amount"]).toEqual({ minor: 5_000, currency: "EUR" });
    const under = [{ kind: "fee", params: { amount: { minor: 100, currency: "EUR" } } }];
    expect(guardFloors(RULES, under, cap).floored).toEqual([]);
  });

  it("throws on a floor that is not a number and on an unregistered kind", () => {
    expect(() =>
      guardFloors(
        RULES,
        [{ kind: "refundWindow", params: { days: 7 } }],
        [floor("consumer.withdrawal_days", "14", FloorBound.Min)],
      ),
    ).toThrow(/is not a number/);
    expect(() => guardFloors(RULES, [{ kind: "giftWrap", params: {} }], FLOORS)).toThrow(TypeError);
  });
});
