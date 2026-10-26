/**
 * Stackra file contract:
 * Purpose: unit tests of `liftFloors`: a top-level field and a section field that cross their floor move to it, a
 *          field above its floor stays, and a floor on a missing section is skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0370 (decision 6); ADR 0395 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { SettingFloor } from "#contracts/index";
import { liftFloors } from "#core/functions/lift-floors.function";

/** A minimum floor of `value` on `path`. */
const min = (path: string, value: number): SettingFloor => ({
  path,
  value,
  bound: "min",
  law: "test law",
  market: "test",
  version: "1.0.0",
});

describe(liftFloors, () => {
  it("lifts crossing fields, top-level and in a section, and keeps the rest", () => {
    const data = { windowDays: 7, keepDays: 30, refunds: { graceDays: 1 } };
    expect(
      liftFloors(data, [min("windowDays", 14), min("keepDays", 10), min("refunds.graceDays", 3)]),
    ).toEqual({ windowDays: 14, keepDays: 30, refunds: { graceDays: 3 } });
  });

  it("skips a floor on a section the group does not have", () => {
    expect(liftFloors({ windowDays: 20 }, [min("missing.days", 5)])).toEqual({ windowDays: 20 });
  });
});
