/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `SettingFloorSource` port: a driver of it is an instance of it with `floors`
 *          typed as the port declares.
 * Boundary: test only; the driver is a minimal stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0370 (decision 6); ADR 0263.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingFloorSource } from "#contracts/ports/setting-floor-source.port";
import type { SettingFloor, SettingTarget } from "#contracts/index";

/** A source with no floors. */
class NoSettingFloorSourceDriver extends Driver(SettingFloorSource) {
  async floors(): Promise<readonly SettingFloor[]> {
    return [];
  }
}

describe("SettingFloorSource", () => {
  it("is a port that a driver extends", async () => {
    const source = new NoSettingFloorSourceDriver();
    expect(source).toBeInstanceOf(SettingFloorSource);
    expect(source).toBeInstanceOf(Port);
    await expect(source.floors()).resolves.toEqual([]);
  });

  it("types floors", () => {
    expectTypeOf<SettingFloorSource["floors"]>().parameters.toEqualTypeOf<
      [string, SettingTarget]
    >();
    expectTypeOf<SettingFloorSource["~key"]>().toEqualTypeOf<"settings.SettingFloorSource">();
  });
});
