/**
 * Stackra file contract:
 * Purpose: unit tests of `crossedFloor`: a number past a `min` or `max` floor, a money amount past a floor in its
 *          currency or in another currency, the right side of a floor, a missing value, and a pack value that does
 *          not fit the parameter; a list that drops an item of a `list` floor (moved to the list plus the dropped
 *          items), and a list floor on a number or a `min` on a list.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; config-model sections 3 and 4; ADR 0220; ADR 0425 (decision 2); ADR 0455.
 */
import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { FieldType } from "#contracts/index";
import { crossedFloor } from "#core/functions/crossed-floor.function";

/** A floor of the `ae` pack. */
const floor = (value: unknown, bound: FloorBound): ResolvedValue =>
  ({
    key: "consumer.floor",
    value,
    market: "ae",
    version: "1.0.0",
    floor: { bound, law: "Federal Law 15/2020" },
  }) as ResolvedValue;

const AED_100 = { minor: 10_000, currency: "AED" };

describe(crossedFloor, () => {
  it("reports a number past a min or max floor", () => {
    expect(crossedFloor(FieldType.Number, 7, floor(14, FloorBound.Min))).toEqual({
      to: 14,
      reason: "past_floor",
    });
    expect(crossedFloor(FieldType.Number, 30, floor(20, FloorBound.Max))).toEqual({
      to: 20,
      reason: "past_floor",
    });
    expect(crossedFloor(FieldType.Number, 14, floor(14, FloorBound.Min))).toBeUndefined();
    expect(crossedFloor(FieldType.Number, undefined, floor(14, FloorBound.Min))).toBeUndefined();
  });

  it("compares money in the floor's currency and refuses another currency", () => {
    const cap = floor(AED_100, FloorBound.Max);
    expect(crossedFloor(FieldType.Money, { minor: 20_000, currency: "AED" }, cap)).toEqual({
      to: AED_100,
      reason: "past_floor",
    });
    expect(crossedFloor(FieldType.Money, { minor: 5000, currency: "AED" }, cap)).toBeUndefined();
    expect(crossedFloor(FieldType.Money, { minor: 5000, currency: "USD" }, cap)).toEqual({
      to: AED_100,
      reason: "currency_mismatch",
    });
  });

  it("throws for a pack value that does not fit the parameter", () => {
    expect(() => crossedFloor(FieldType.Money, AED_100, floor(100, FloorBound.Max))).toThrow(
      TypeError,
    );
    expect(() => crossedFloor(FieldType.Number, 5, floor(AED_100, FloorBound.Max))).toThrow(
      TypeError,
    );
  });

  it("ignores an entry that is not a floor", () => {
    const plain = {
      key: "consumer.floor",
      value: 14,
      market: "ae",
      version: "1.0.0",
    } as ResolvedValue;
    expect(crossedFloor(FieldType.Number, 7, plain)).toBeUndefined();
  });

  it("moves a list that drops an item of a list floor to the list plus the dropped items", () => {
    const refused = floor(["fireworks", "knives"], FloorBound.List);
    expect(crossedFloor(FieldType.List, ["knives", "acids"], refused)).toEqual({
      to: ["knives", "acids", "fireworks"],
      reason: "past_floor",
    });
    expect(crossedFloor(FieldType.List, ["knives", "fireworks", "acids"], refused)).toBeUndefined();
    expect(crossedFloor(FieldType.List, undefined, refused)).toBeUndefined();
  });

  it("throws for a list floor on a number, a min on a list, or a list floor that is not strings", () => {
    expect(() => crossedFloor(FieldType.Number, 1, floor(["a"], FloorBound.List))).toThrow(
      TypeError,
    );
    expect(() => crossedFloor(FieldType.List, ["a"], floor(1, FloorBound.Min))).toThrow(TypeError);
    expect(() => crossedFloor(FieldType.List, ["a"], floor([1], FloorBound.List))).toThrow(
      TypeError,
    );
  });
});
