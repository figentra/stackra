/**
 * Stackra file contract:
 * Purpose: unit tests of `MinorUnitsType`: safe integers round-trip through the stored decimal text, and a value
 *          beyond `Number.MAX_SAFE_INTEGER` is refused in both directions instead of rounded.
 * Boundary: test only; calls the conversions directly, without an ORM.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 27); ADR 0220.
 */
import { describe, expect, it } from "@stackra/testing";

import { MinorUnitsType } from "#core/orm/minor-units.type";

describe(MinorUnitsType, () => {
  const type = new MinorUnitsType();

  it("round-trips safe integers", () => {
    expect(type.convertToDatabaseValue(1_250)).toBe("1250");
    expect(type.convertToJSValue("1250")).toBe(1_250);
    expect(type.convertToJSValue(-9_007_199_254_740_991n)).toBe(-Number.MAX_SAFE_INTEGER);
    expect(type.convertToJSValue(null)).toBeNull();
  });

  it("refuses values beyond the safe range", () => {
    expect(() => type.convertToJSValue("9007199254740992")).toThrow(RangeError);
    expect(() => type.convertToJSValue("-9007199254740993")).toThrow(RangeError);
    expect(() => type.convertToDatabaseValue(2 ** 53)).toThrow(RangeError);
    expect(() => type.convertToDatabaseValue(1.5)).toThrow(RangeError);
  });
});
