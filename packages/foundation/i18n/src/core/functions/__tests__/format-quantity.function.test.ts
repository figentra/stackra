/**
 * Stackra file contract:
 * Purpose: unit tests of `formatQuantity` and `DisplayUnit`: a mass, length or volume stored metric shown in imperial
 *          units (and back), rounded once, in the locale's separators; another dimension is refused.
 * Boundary: test only.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0403.
 */
import { Enum } from "@stackra/contracts";
import { Quantity } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import { DisplayUnit } from "#core/enums/display-unit.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { formatQuantity } from "#core/functions/format-quantity.function";

/** US English with Latin digits at `places`. */
const us = (places: number) => ({ locale: "en-US", numerals: NumberingSystem.Latn, places });

describe("formatQuantity", () => {
  it("shows metric storage in imperial units", () => {
    expect(formatQuantity(Quantity.of(1000, "g"), DisplayUnit.Lb, us(2))).toBe("2.20 lb");
    expect(formatQuantity(Quantity.of(1, "m"), DisplayUnit.Ft, us(1))).toBe("3.3 ft");
    expect(formatQuantity(Quantity.of(1, "l"), DisplayUnit.FlOz, us(1))).toMatch(/^33\.8 fl/);
  });

  it("shows imperial values in metric units, in the locale's separators", () => {
    expect(
      formatQuantity(Quantity.of(1, "lb"), DisplayUnit.Kg, {
        locale: "nl",
        numerals: NumberingSystem.Latn,
        places: 3,
      }),
    ).toBe("0,454 kg");
  });

  it("refuses a quantity of another dimension", () => {
    expect(() => formatQuantity(Quantity.of(1, "kg"), DisplayUnit.In, us(0))).toThrow(TypeError);
  });

  it("maps each unit to a Quantity unit and its Intl unit", () => {
    for (const unit of Enum.values(DisplayUnit)) expect(() => Quantity.of(1, unit)).not.toThrow();
    expect(Enum.meta(DisplayUnit, DisplayUnit.Gal).intl).toBe("gallon");
  });
});
