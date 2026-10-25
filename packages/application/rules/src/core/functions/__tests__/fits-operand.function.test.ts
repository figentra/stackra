/**
 * Stackra file contract:
 * Purpose: unit tests of `fitsOperand`: each operand shape (none, one, many, range, duration, circle) accepts what it
 *          takes for each field type and refuses the rest: bounds on text and lists, money amounts and their
 *          currencies, ISO instants with an offset, enum codes, ordered ranges, positive durations and valid circles.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 3 and 10).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { type FactField, FieldType, Operator } from "#contracts/index";
import { fitsOperand } from "#core/functions/fits-operand.function";

/** A label key. */
const label = "shop::facts.field" as I18nKey;

/** One field of each type. */
const FIELDS = {
  string: { type: FieldType.String, label },
  number: { type: FieldType.Number, label },
  money: { type: FieldType.Money, label },
  date: { type: FieldType.Date, label },
  enum: { type: FieldType.Enum, label, values: { gold: label } },
  list: { type: FieldType.List, label },
  geo: { type: FieldType.Geo, label },
} satisfies Record<string, FactField>;

/** Ten dollars as JSON. */
const TEN_USD = { minor: 1000, currency: "USD" };

describe("fitsOperand", () => {
  it("takes no value for an operator that takes none", () => {
    expect(fitsOperand(FIELDS.string, Operator.IsSet, undefined)).toBe(true);
    expect(fitsOperand(FIELDS.list, Operator.IsEmpty, undefined)).toBe(true);
    expect(fitsOperand(FIELDS.string, Operator.IsSet, null)).toBe(false);
    expect(fitsOperand(FIELDS.string, Operator.IsNotSet, "x")).toBe(false);
  });

  it("takes one element of the field's type", () => {
    expect(fitsOperand(FIELDS.string, Operator.Contains, "@acme.com")).toBe(true);
    expect(fitsOperand(FIELDS.string, Operator.Equals, "x".repeat(1001))).toBe(false);
    expect(fitsOperand(FIELDS.number, Operator.AtLeast, 3)).toBe(true);
    expect(fitsOperand(FIELDS.number, Operator.AtLeast, "3")).toBe(false);
    expect(fitsOperand(FIELDS.money, Operator.AtLeast, TEN_USD)).toBe(true);
    expect(fitsOperand(FIELDS.money, Operator.AtLeast, { minor: 10.5, currency: "USD" })).toBe(
      false,
    );
    expect(fitsOperand(FIELDS.money, Operator.AtLeast, { minor: 1, currency: "XXX" })).toBe(false);
    expect(fitsOperand(FIELDS.money, Operator.AtLeast, { ...TEN_USD, note: "x" })).toBe(false);
    expect(fitsOperand(FIELDS.date, Operator.Before, "2026-10-01T00:00:00Z")).toBe(true);
    expect(fitsOperand(FIELDS.date, Operator.Before, "2026-10-01")).toBe(false);
    expect(fitsOperand(FIELDS.enum, Operator.Equals, "gold")).toBe(true);
    expect(fitsOperand(FIELDS.enum, Operator.Equals, "bronze")).toBe(false);
    expect(fitsOperand(FIELDS.list, Operator.Includes, "vip")).toBe(true);
  });

  it("takes 1 to 100 elements for a many-valued operator", () => {
    expect(fitsOperand(FIELDS.string, Operator.OneOf, ["a", "b"])).toBe(true);
    expect(fitsOperand(FIELDS.string, Operator.OneOf, [])).toBe(false);
    expect(
      fitsOperand(
        FIELDS.string,
        Operator.OneOf,
        Array.from({ length: 101 }, () => "a"),
      ),
    ).toBe(false);
    expect(fitsOperand(FIELDS.enum, Operator.NotOneOf, ["gold", "bronze"])).toBe(false);
    expect(fitsOperand(FIELDS.list, Operator.IncludesAll, "vip")).toBe(false);
  });

  it("takes an ordered range of two in one currency", () => {
    expect(fitsOperand(FIELDS.number, Operator.Between, [1, 5])).toBe(true);
    expect(fitsOperand(FIELDS.number, Operator.Between, [5, 1])).toBe(false);
    expect(fitsOperand(FIELDS.number, Operator.Between, [1, 2, 3])).toBe(false);
    expect(
      fitsOperand(FIELDS.money, Operator.Between, [TEN_USD, { minor: 2000, currency: "USD" }]),
    ).toBe(true);
    expect(
      fitsOperand(FIELDS.money, Operator.Between, [TEN_USD, { minor: 2000, currency: "EUR" }]),
    ).toBe(false);
    expect(
      fitsOperand(FIELDS.date, Operator.Between, ["2026-10-02T00:00:00Z", "2026-10-01T00:00:00Z"]),
    ).toBe(false);
  });

  it("takes a positive duration, short or ISO", () => {
    expect(fitsOperand(FIELDS.date, Operator.WithinLast, "30d")).toBe(true);
    expect(fitsOperand(FIELDS.date, Operator.WithinLast, "PT15M")).toBe(true);
    expect(fitsOperand(FIELDS.date, Operator.WithinLast, "0d")).toBe(false);
    expect(fitsOperand(FIELDS.date, Operator.WithinLast, "soon")).toBe(false);
    expect(fitsOperand(FIELDS.date, Operator.WithinLast, 30)).toBe(false);
  });

  it("takes a circle on the earth with a positive radius", () => {
    const circle = { latitude: 25.2, longitude: 55.27, radiusKilometres: 10 };
    expect(fitsOperand(FIELDS.geo, Operator.WithinRadius, circle)).toBe(true);
    expect(fitsOperand(FIELDS.geo, Operator.WithinRadius, { ...circle, latitude: 91 })).toBe(false);
    expect(fitsOperand(FIELDS.geo, Operator.WithinRadius, { ...circle, radiusKilometres: 0 })).toBe(
      false,
    );
    expect(fitsOperand(FIELDS.geo, Operator.OutsideRadius, { latitude: 1, longitude: 1 })).toBe(
      false,
    );
  });
});
