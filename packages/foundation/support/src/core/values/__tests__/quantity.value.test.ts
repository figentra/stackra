/**
 * Stackra file contract:
 * Purpose: unit tests of `Quantity`: exact conversion inside a dimension (yards to metres, pounds to grams, and back
 *          without drift), refusal across dimensions and of float amounts, arithmetic, ratio, comparison and the one
 *          rounding in `toDecimal`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; COM-76.
 */
import { describe, expect, it } from "@stackra/testing";

import { Quantity } from "#core/values/quantity.value";

describe("Quantity", () => {
  it("converts exactly within a dimension", () => {
    expect(Quantity.of("2.5", "yd").to("m").toDecimal(4)).toBe("2.2860");
    expect(Quantity.of(1, "lb").to("g").toDecimal(5)).toBe("453.59237");
    expect(Quantity.of(1, "in").to("cm").toDecimal(2)).toBe("2.54");
  });

  it("round-trips without drift", () => {
    const start = Quantity.of("3", "fl_oz");
    expect(start.to("ml").to("gal").to("fl_oz").equals(start)).toBe(true);
    expect(start.to("ml").to("fl_oz").amount).toEqual({ num: 3n, den: 1n });
  });

  it("refuses another dimension, an unknown unit and a float amount", () => {
    expect(() => Quantity.of(1, "kg").to("m")).toThrow(TypeError);
    expect(() => Quantity.of(1, "stone" as never)).toThrow(RangeError);
    expect(() => Quantity.of(0.1, "kg")).toThrow(RangeError);
    expect(() => Quantity.of("1e3", "kg")).toThrow(RangeError);
  });

  it("adds, subtracts and scales in the receiver's unit", () => {
    const sum = Quantity.of("750", "g").add(Quantity.of("1", "kg"));
    expect(sum.unit).toBe("g");
    expect(sum.toDecimal(0)).toBe("1750");
    expect(Quantity.of(1, "m").subtract(Quantity.of(30, "cm")).toDecimal(2)).toBe("0.70");
    expect(Quantity.of("0.25", "kg").times(3).toDecimal(2)).toBe("0.75");
  });

  it("gives the unit-price ratio and compares across units", () => {
    expect(Quantity.of("1.5", "kg").ratio(Quantity.of(100, "g"))).toEqual({ num: 15n, den: 1n });
    expect(Quantity.of(1, "kg").compare(Quantity.of(999, "g"))).toBe(1);
    expect(Quantity.of(100, "cm").equals(Quantity.of(1, "m"))).toBe(true);
    expect(() => Quantity.of(1, "kg").ratio(Quantity.of(0, "g"))).toThrow(RangeError);
  });

  it("rounds half away from zero once, when asked", () => {
    expect(Quantity.of("0.125", "m").toDecimal(2)).toBe("0.13");
    expect(Quantity.of("-0.125", "m").toDecimal(2)).toBe("-0.13");
    expect(Quantity.of("-0.001", "m").toDecimal(2)).toBe("0.00");
    expect(Quantity.of(1, "in").to("m").toString()).toBe("0.0254 m");
    expect(() => Quantity.of(1, "m").toDecimal(-1)).toThrow(RangeError);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(Quantity.of(1, "piece"))).toBe(true);
  });
});
