/**
 * Stackra file contract:
 * Purpose: unit tests of `refuseBelowFloors`: a crossing written path refuses with its law and market; others pass.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0370 (decision 6).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { SettingFloor } from "#contracts/index";
import { SettingBelowFloorError } from "#core/errors/setting-below-floor.error";
import { refuseBelowFloors } from "#core/functions/refuse-below-floors.function";

const FLOOR: SettingFloor = {
  path: "days",
  value: 14,
  bound: "min",
  law: "EU 2011/83",
  market: "eu",
  version: "1.0.0",
};

describe("refuseBelowFloors", () => {
  it("refuses a crossing value with the floor's law and market", () => {
    let refused: unknown;
    try {
      refuseBelowFloors({ days: 7 }, [FLOOR]);
    } catch (error) {
      refused = error;
    }
    expect(isRefusal(refused, SettingBelowFloorError)).toBe(true);
    expect((refused as SettingBelowFloorError).floors).toEqual([
      { path: "days", law: "EU 2011/83", market: "eu" },
    ]);
    expect((refused as SettingBelowFloorError).fieldErrors).toEqual({
      days: "setting_below_floor",
    });
  });

  it("passes a value on the right side and a write that does not touch the path", () => {
    expect(() => refuseBelowFloors({ days: 14 }, [FLOOR])).not.toThrow();
    expect(() => refuseBelowFloors({ other: 1 }, [FLOOR])).not.toThrow();
  });
});
