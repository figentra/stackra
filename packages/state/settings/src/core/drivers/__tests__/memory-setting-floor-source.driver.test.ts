/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySettingFloorSourceDriver`: no floors until seeded, a seed replaces, reads are copies.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0370 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { SettingFloorSource } from "#contracts/index";
import type { SettingFloor } from "#contracts/index";
import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";

const FLOOR: SettingFloor = {
  path: "days",
  value: 14,
  bound: "min",
  law: "law",
  market: "eu",
  version: "1.0.0",
};

describe(MemorySettingFloorSourceDriver, () => {
  it("is a SettingFloorSource with no floors until seeded", async () => {
    const source = new MemorySettingFloorSourceDriver();
    expect(source).toBeInstanceOf(SettingFloorSource);
    await expect(source.floors("orders", {})).resolves.toEqual([]);
  });

  it("answers the seeded floors of a group, replaced by a later seed", async () => {
    const source = new MemorySettingFloorSourceDriver().seed("orders", [FLOOR]);
    await expect(source.floors("orders", {})).resolves.toEqual([FLOOR]);
    source.seed("orders", []);
    await expect(source.floors("orders", {})).resolves.toEqual([]);
  });
});
