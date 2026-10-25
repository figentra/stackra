/**
 * Stackra file contract:
 * Purpose: unit tests of `QUANTITY_UNITS`: every factor is an exact positive decimal and each dimension has a base
 *          unit of factor 1.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { QUANTITY_UNITS } from "#core/constants/quantity-units.constant";
import { parseDecimal } from "#core/functions/parse-decimal.function";

describe("QUANTITY_UNITS", () => {
  it("has exact positive factors and one base per dimension", () => {
    const units = Object.values(QUANTITY_UNITS);
    expect(units.every((unit) => parseDecimal(unit.factor).num > 0n)).toBe(true);
    const bases = units.filter((unit) => unit.factor === "1").map((unit) => unit.dimension);
    expect(new Set(bases)).toEqual(new Set(["mass", "length", "volume", "count"]));
  });
});
