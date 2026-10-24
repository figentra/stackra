/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySettingValueStoreDriver`: seeds sit at the root holder; layers come root first along
 *          the node's path and then the user's, never a sibling's; a write sets values and locks in its own holder,
 *          keeps a lock without `locked`, and a key locked above refuses the whole write.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 2: the cascade, locks).
 */
import type { ScopeRef } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingValueStore } from "#contracts/index";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsLockedError } from "#core/errors/settings-locked.error";

const PLATFORM: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const OTHER: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.other" };
const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" as const;

describe(MemorySettingValueStoreDriver, () => {
  it("is a SettingValueStore", () => {
    expect(new MemorySettingValueStoreDriver()).toBeInstanceOf(SettingValueStore);
  });

  it("reads the seeds at the root, then the node chain root first, then the user", async () => {
    const store = new MemorySettingValueStoreDriver().seed("orders", { acceptingOrders: false });
    await store.write("orders", { scope: ACME }, { a: 3 });
    await store.write("orders", { scope: PLATFORM }, { a: 2 });
    await store.write("orders", { scope: OTHER }, { a: 9 });
    await store.write("orders", { user: USER }, { a: 4 });
    await expect(store.layers("orders", { scope: ACME, user: USER })).resolves.toEqual([
      { values: { acceptingOrders: false }, locked: [] },
      { values: { a: 2 }, locked: [] },
      { values: { a: 3 }, locked: [] },
      { values: { a: 4 }, locked: [] },
    ]);
    await expect(store.layers("orders", {})).resolves.toEqual([
      { values: { acceptingOrders: false }, locked: [] },
    ]);
    await expect(store.layers("inventory", { scope: ACME })).resolves.toEqual([]);
  });

  it("sets locks with `locked` and keeps them without", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("orders", { scope: PLATFORM }, { a: 1, b: 2 }, ["a"]);
    await store.write("orders", { scope: PLATFORM }, { a: 5 });
    await expect(store.layers("orders", { scope: PLATFORM })).resolves.toEqual([
      { values: { a: 5, b: 2 }, locked: ["a"] },
    ]);
    await store.write("orders", { scope: PLATFORM }, { a: 6 }, []);
    await expect(store.layers("orders", { scope: PLATFORM })).resolves.toEqual([
      { values: { a: 6, b: 2 }, locked: [] },
    ]);
  });

  it("refuses a key locked above the target and writes nothing", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("orders", { scope: PLATFORM }, { a: 1 }, ["a"]);
    const refused = await store
      .write("orders", { scope: ACME }, { a: 2, b: 3 })
      .catch((error: unknown) => error);
    expect(isRefusal(refused, SettingsLockedError)).toBe(true);
    expect((refused as SettingsLockedError).paths).toEqual(["a"]);
    await expect(
      store.write("orders", { user: USER, scope: ACME }, { a: 4 }),
    ).rejects.toBeInstanceOf(SettingsLockedError);
    await expect(store.layers("orders", { scope: ACME, user: USER })).resolves.toEqual([
      { values: { a: 1 }, locked: ["a"] },
    ]);
  });

  it("lets a holder change its own locked value", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("orders", { scope: PLATFORM }, { a: 1 }, ["a"]);
    await expect(store.write("orders", { scope: PLATFORM }, { a: 2 })).resolves.toBeUndefined();
  });
});
