/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeResolver`: the resolver is real and sits over the returned drivers, the seeded values are
 *          root values, the seeded floors are each group's, and the clock stands where the test puts it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import type { SettingFloor } from "#contracts/index";
import { SettingsResolver } from "#core/index";
import { fakeResolver } from "#testing/functions/fake-resolver.function";

const FLOOR: SettingFloor = {
  path: "windowDays",
  value: 14,
  bound: "min",
  law: "test law",
  market: "test",
  version: "1.0.0",
};

describe(fakeResolver, () => {
  it("builds a real resolver over seeded memory drivers and a settable clock", async () => {
    const fake = fakeResolver({
      values: { returns: { windowDays: 7 } },
      floors: { returns: [FLOOR] },
      now: new Date("2026-10-26T09:00:00.000Z"),
    });
    expect(fake.resolver).toBeInstanceOf(SettingsResolver);
    const [root] = await fake.values.layers("returns", {});
    expect(root?.values).toEqual({ windowDays: 7 });
    await expect(fake.floors.floors("returns")).resolves.toEqual([FLOOR]);
    expect(fake.clock.now().toISOString()).toBe("2026-10-26T09:00:00.000Z");
    fake.clock.at = new Date("2026-10-27T09:00:00.000Z");
    expect(fake.clock.now().toISOString()).toBe("2026-10-27T09:00:00.000Z");
    await expect(fake.revisions.list("returns", {})).resolves.toEqual([]);
  });
});
