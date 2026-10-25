/**
 * Stackra file contract:
 * Purpose: `MemorySettingFloorSourceDriver`, a `SettingFloorSource` held in memory: for tests, local runs and a
 *          deployment with no market packs (it answers no floor until seeded).
 * Boundary: holds floors per group for every target; it knows no market, so a test seeds the floors of the market it
 *           plays. Reads return copies.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0142 (drivers behind a port); ADR 0266 (memory drivers first).
 */
import { Driver } from "@stackra/container";

import { SettingFloorSource } from "#contracts/index";
import type { SettingFloor } from "#contracts/index";

/**
 * Floors in memory.
 *
 * @example
 * const floors = new MemorySettingFloorSourceDriver().seed("orders", [{ path: "refundWindowDays", value: 14, bound: "min", law, market: "eu", version: "1.0.0" }]);
 */
export class MemorySettingFloorSourceDriver extends Driver(SettingFloorSource) {
  /** The floors by group. */
  private readonly byGroup = new Map<string, readonly SettingFloor[]>();

  /**
   * Sets the floors of `group`, replacing any before.
   *
   * @returns this source, to chain.
   */
  seed(group: string, floors: readonly SettingFloor[]): this {
    this.byGroup.set(group, [...floors]);
    return this;
  }

  /** See `SettingFloorSource.floors`. */
  async floors(group: string): Promise<readonly SettingFloor[]> {
    return [...(this.byGroup.get(group) ?? [])];
  }
}
