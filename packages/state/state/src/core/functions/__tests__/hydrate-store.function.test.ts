/**
 * Stackra file contract:
 * Purpose: unit tests of `hydrateStore`: synchronous areas hydrate at once and asynchronous ones through the returned
 *          promise; it runs once; unknown fields, fields of another type and corrupt values are ignored; listeners are
 *          notified only when a field changed; nothing is written back; a session-only store is hydrated trivially.
 * Boundary: test only; areas are hand-written stubs and the in-memory test storage.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079; ADR 0256.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Store } from "#core/bases/store.base";
import { hydrateStore } from "#core/functions/hydrate-store.function";
import { registerStores } from "#core/functions/register-stores.function";
import { storeVersion } from "#core/functions/store-version.function";
import { subscribeStore } from "#core/functions/subscribe-store.function";
import type { StoreStorage } from "#core/types/store-storage.type";
import { MemoryStoreStorage } from "#testing/memory-store-storage.fake";

class PreferencesStore extends Store({ persist: "prefs" }) {
  tenantByUser: Record<string, string> = {};

  lastTab = "home";
}

class DraftStore extends Store {
  text = "";
}

registerStores([[PreferencesStore, "mobile.preferences"]]);

/** Storage whose `prefs` area answers `get` with `saved` and records writes. */
function stubStorage(saved: unknown) {
  const set = vi.fn();
  const get = vi.fn(() => saved);
  const storage: StoreStorage = { area: () => ({ get, set }) };
  return { storage, get, set };
}

describe("hydrateStore", () => {
  it("applies a synchronous saved state at once and writes nothing back", () => {
    const { storage, set } = stubStorage({ tenantByUser: { usr_1: "ten_2" }, lastTab: "orders" });
    const store = new PreferencesStore(storage);
    expect(hydrateStore(store)).toBeUndefined();
    expect(store).toMatchObject({ tenantByUser: { usr_1: "ten_2" }, lastTab: "orders" });
    expect(set).not.toHaveBeenCalled();
  });

  it("applies an asynchronous saved state through the returned promise", async () => {
    const { storage } = stubStorage(Promise.resolve({ lastTab: "profile" }));
    const store = new PreferencesStore(storage);
    const running = hydrateStore(store);
    expect(running).toBeInstanceOf(Promise);
    expect(hydrateStore(store)).toBe(running);
    await running;
    expect(store.lastTab).toBe("profile");
    expect(hydrateStore(store)).toBeUndefined();
  });

  it("reads storage once however often it is called", () => {
    const { storage, get } = stubStorage({ lastTab: "orders" });
    const store = new PreferencesStore(storage);
    hydrateStore(store);
    hydrateStore(store);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("mobile.preferences");
  });

  it("ignores unknown fields, fields of another type and corrupt values", () => {
    const store = new PreferencesStore(stubStorage({ lastTab: 3, removed: true }).storage);
    hydrateStore(store);
    expect({ ...store }).toEqual({ tenantByUser: {}, lastTab: "home" });
    for (const saved of ["corrupt", null, 7]) {
      const other = new PreferencesStore(stubStorage(saved).storage);
      hydrateStore(other);
      expect(other.lastTab).toBe("home");
    }
  });

  it("notifies only when a field changed", () => {
    const same = new PreferencesStore(stubStorage({ lastTab: "home" }).storage);
    const listener = vi.fn();
    subscribeStore(same, listener);
    hydrateStore(same);
    expect(listener).not.toHaveBeenCalled();
    expect(storeVersion(same)).toBe(0);

    const changed = new PreferencesStore(stubStorage({ lastTab: "orders" }).storage);
    subscribeStore(changed, listener);
    hydrateStore(changed);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storeVersion(changed)).toBe(1);
  });

  it("hydrates a session-only store or one without storage trivially", () => {
    expect(hydrateStore(new DraftStore(new MemoryStoreStorage()))).toBeUndefined();
    expect(hydrateStore(new PreferencesStore())).toBeUndefined();
  });

  it("throws for an object that is not a store", () => {
    expect(() => hydrateStore({})).toThrow(TypeError);
  });
});
