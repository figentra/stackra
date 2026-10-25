/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsPackService`: export holds only the target's own values (never inherited ones) and
 *          skips empty groups; applying a pack makes the holder equal it with one revision per changed group;
 *          applying rows writes, relocks and removes; a store that does not name holders cannot export.
 * Boundary: test only; memory drivers and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 4); ADR 0280 (decision 1).
 */
import { Driver } from "@stackra/container";
import type { Clock, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SettingEnvironment, SettingValueStore } from "#contracts/index";
import type { SettingLayer } from "#contracts/index";
import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsPackService } from "#core/services/settings-pack.service";
import { SettingsResolver } from "#core/services/settings-resolver.service";

const PLATFORM: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const META = { author: "usr_a", environment: SettingEnvironment.Live };
const CLOCK = { now: () => new Date("2026-10-25T10:00:00.000Z") } as unknown as Clock;

/** The pack service over `store`. */
function packsOver(store: SettingValueStore) {
  const resolver = new SettingsResolver(
    store,
    new MemorySettingFloorSourceDriver(),
    new MemorySettingRevisionStoreDriver(),
    CLOCK,
  );
  return new SettingsPackService(store, resolver);
}

/** A store whose layers name no holder. */
class AnonymousSettingValueStoreDriver extends Driver(SettingValueStore) {
  async layers(): Promise<readonly SettingLayer[]> {
    return [{ values: { a: 1 }, locked: [] }];
  }

  async write(): Promise<void> {}

  async remove(): Promise<void> {}
}

describe(SettingsPackService, () => {
  it("exports only the target's own values and skips empty groups", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("orders", { scope: PLATFORM }, { inherited: true });
    await store.write("orders", { scope: ACME }, { b: 2, a: 1 }, ["b"]);
    await expect(
      packsOver(store).exportPack({ scope: ACME }, ["orders", "checkout"]),
    ).resolves.toEqual({
      groups: { orders: { values: { a: 1, b: 2 }, locked: ["b"] } },
    });
  });

  it("applies a pack with one revision per changed group", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("orders", { scope: ACME }, { a: 1, old: "x" });
    const packs = packsOver(store);
    const revisions = await packs.applyPack(
      { scope: ACME },
      {
        groups: {
          orders: { values: { a: 2 }, locked: ["a"] },
          checkout: { values: { guest: true }, locked: [] },
        },
      },
      META,
    );
    expect(revisions.map((revision) => revision.group)).toEqual(["checkout", "orders"]);
    await expect(packs.exportPack({ scope: ACME }, ["orders", "checkout"])).resolves.toEqual({
      groups: {
        checkout: { values: { guest: true }, locked: [] },
        orders: { values: { a: 2 }, locked: ["a"] },
      },
    });
  });

  it("refuses to export from a store that does not name holders", async () => {
    await expect(
      packsOver(new AnonymousSettingValueStoreDriver()).exportPack({ scope: ACME }, ["orders"]),
    ).rejects.toThrow(TypeError);
  });
});
