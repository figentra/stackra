/**
 * Stackra file contract:
 * Purpose: unit and type tests of `createStore`: the template's `PreferencesStore` case (a second store over the same
 *          storage reads what the first wrote, users kept apart), memory storage when none is given, an asynchronous
 *          driver awaited, the instance typed as the class, and the throw for an unregistered persisted store.
 * Boundary: test only; the template's `apps/mobile/src/stores/preferences.store.ts` with the storage enum replaced by
 *           its code; storage is the in-memory test storage or a hand-written asynchronous stub.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0079; ADR 0256.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { registerStores, Store } from "#core/index";
import type { StoreStorage } from "#core/index";
import { createStore } from "#testing/functions/create-store.function";
import { MemoryStoreStorage } from "#testing/memory-store-storage.fake";

class PreferencesStore extends Store({ persist: "prefs" }) {
  tenantByUser: Record<string, string> = {};

  rememberTenant(userId: string, tenantId: string): void {
    this.set((s) => ({ tenantByUser: { ...s.tenantByUser, [userId]: tenantId } }));
  }

  tenantFor(userId: string): string | undefined {
    return this.tenantByUser[userId];
  }
}

class OrphanStore extends Store({ persist: "prefs" }) {
  value = 0;
}

registerStores([[PreferencesStore, "mobile.preferences"]]);

describe("createStore", () => {
  it("persists the remembered tenant per user across instances", async () => {
    const storage = new MemoryStoreStorage();
    const first = await createStore(PreferencesStore, { storage });
    first.rememberTenant("usr_1", "ten_2");
    const second = await createStore(PreferencesStore, { storage });
    expect(second.tenantFor("usr_1")).toBe("ten_2");
    expect(second.tenantFor("usr_2")).toBeUndefined();
    expectTypeOf(second).toEqualTypeOf<PreferencesStore>();
  });

  it("uses fresh memory storage when none is given", async () => {
    const first = await createStore(PreferencesStore);
    first.rememberTenant("usr_1", "ten_2");
    expect((await createStore(PreferencesStore)).tenantFor("usr_1")).toBeUndefined();
  });

  it("resolves after an asynchronous driver's read", async () => {
    const storage: StoreStorage = {
      area: () => ({
        get: async () => ({ tenantByUser: { usr_1: "ten_3" } }),
        set: async () => undefined,
      }),
    };
    expect((await createStore(PreferencesStore, { storage })).tenantFor("usr_1")).toBe("ten_3");
  });

  it("rejects for a persisted store with no registered key", async () => {
    await expect(createStore(OrphanStore)).rejects.toThrow(
      /OrphanStore persists but has no registered key/,
    );
  });
});
