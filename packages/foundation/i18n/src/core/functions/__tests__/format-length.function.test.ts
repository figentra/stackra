/**
 * Stackra file contract:
 * Purpose: unit tests of `formatLength` and `LengthUnit`: a stored length shown in centimetres or inches, rounded once,
 *          with the configured digits.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; row "length units" of the package needs.
 */
import { Enum } from "@stackra/contracts";
import { Quantity } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import { LengthUnit } from "#core/enums/length-unit.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { formatLength } from "#core/functions/format-length.function";

describe("formatLength", () => {
  it("converts exactly and formats the unit", () => {
    const latin = { locale: "en", numerals: NumberingSystem.Latn, places: 1 };
    expect(formatLength(Quantity.of(100, "cm"), LengthUnit.In, latin)).toBe("39.4 in");
    expect(formatLength(Quantity.of(10, "in"), LengthUnit.Cm, latin)).toBe("25.4 cm");
    expect(
      formatLength(Quantity.of(1, "m"), LengthUnit.Cm, {
        ...latin,
        numerals: NumberingSystem.Arab,
      }),
    ).toMatch(/١٠٠٫٠/);
  });

  it("refuses a quantity that is not a length", () => {
    expect(() =>
      formatLength(Quantity.of(1, "kg"), LengthUnit.Cm, {
        locale: "en",
        numerals: NumberingSystem.Latn,
        places: 0,
      }),
    ).toThrow(TypeError);
  });

  it("maps each unit to its Intl unit", () => {
    expect(Enum.values(LengthUnit)).toEqual(["cm", "in"]);
    expect(Enum.meta(LengthUnit, LengthUnit.In).intl).toBe("inch");
  });
});
