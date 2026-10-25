/**
 * Stackra file contract:
 * Purpose: unit tests of `crossesFloor`: below a minimum, above a maximum, booleans, and a value of another type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0370 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import type { SettingFloor } from "#contracts/index";
import { crossesFloor } from "#core/functions/crosses-floor.function";

const MIN: SettingFloor = {
  path: "a",
  value: 14,
  bound: "min",
  law: "law",
  market: "eu",
  version: "1.0.0",
};
const MAX: SettingFloor = { ...MIN, bound: "max", value: 100 };
const ON: SettingFloor = { ...MIN, value: true };

describe("crossesFloor", () => {
  it("compares numbers on the floor's side", () => {
    expect(crossesFloor(7, MIN)).toBe(true);
    expect(crossesFloor(14, MIN)).toBe(false);
    expect(crossesFloor(101, MAX)).toBe(true);
    expect(crossesFloor(100, MAX)).toBe(false);
  });

  it("orders false below true", () => {
    expect(crossesFloor(false, ON)).toBe(true);
    expect(crossesFloor(true, ON)).toBe(false);
  });

  it("treats null, a missing value and another type as crossing", () => {
    expect(crossesFloor(null, MIN)).toBe(true);
    expect(crossesFloor(undefined, MIN)).toBe(true);
    expect(crossesFloor("30", MIN)).toBe(true);
  });
});
