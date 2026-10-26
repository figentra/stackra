/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Store`: both forms extend it and record their kind and options; fields are the
 *          state and `set` the only writer (object and function patches, unknown fields refused, no-op patches silent);
 *          a persisted store writes its whole state under its registered key and hydrates it on a microtask without
 *          overwriting fields written first; an unregistered persisted store refuses to build; a store built without
 *          storage lives in memory.
 * Boundary: test only; the stores are the template's console `UiStore` and `PaletteStore` shapes over the in-memory
 *           test storage.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0079; ADR 0294
 *                     (decisions 16 and 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Store } from "#core/bases/store.base";
import { hydrateStore } from "#core/functions/hydrate-store.function";
import { registerStores } from "#core/functions/register-stores.function";
import { storeVersion } from "#core/functions/store-version.function";
import { subscribeStore } from "#core/functions/subscribe-store.function";
import { MemoryStoreStorage } from "#testing/memory-store-storage.fake";

class UiStore extends Store({ persist: "prefs" }) {
  sidebarCollapsed = false;

  density = "comfortable";

  get densityClass(): string {
    return `panel-${this.density}`;
  }

  toggleSidebar(): void {
    this.set({ sidebarCollapsed: !this.sidebarCollapsed });
  }

  setDensity(density: string): void {
    this.set((state) => ({ density: state.density === density ? state.density : density }));
  }

  setUnknown(): void {
    this.set({ notAField: 1 });
  }

  setMethod(): void {
    this.set({ toggleSidebar: 1 });
  }
}

class PaletteStore extends Store {
  isOpen = false;

  open(): void {
    this.set({ isOpen: true });
  }
}

class UnregisteredStore extends Store({ persist: "prefs" }) {
  count = 0;
}

registerStores([[UiStore, "console.ui"]]);

describe("Store", () => {
  it("is a kind base in both forms, recording the persisted area", () => {
    expect(new UiStore()).toBeInstanceOf(Store);
    expect(new PaletteStore()).toBeInstanceOf(Store);
    expect(kindOf(UiStore)).toEqual({ kind: "store", options: { persist: "prefs" } });
    expect(kindOf(PaletteStore)).toEqual({ kind: "store", options: {} });
    expect(Store.name).toBe("Store");
  });

  it("keeps the fields as the state and nothing else on the instance", () => {
    const store = new UiStore();
    expect({ ...store }).toEqual({ sidebarCollapsed: false, density: "comfortable" });
    expect(store.densityClass).toBe("panel-comfortable");
  });

  it("writes through set with an object or a function patch", () => {
    const store = new UiStore();
    store.toggleSidebar();
    store.setDensity("compact");
    expect(store.sidebarCollapsed).toBe(true);
    expect(store.density).toBe("compact");
    expect(store.densityClass).toBe("panel-compact");
  });

  it("refuses a patch naming something that is not a field", () => {
    const store = new UiStore();
    expect(() => store.setUnknown()).toThrow(/UiStore has no state field "notAField"/);
    expect(() => store.setMethod()).toThrow(/no state field "toggleSidebar"/);
  });

  it("notifies once per change and not for a patch that changes nothing", () => {
    const store = new PaletteStore();
    let calls = 0;
    subscribeStore(store, () => {
      calls += 1;
    });
    store.open();
    store.open();
    expect(calls).toBe(1);
    expect(storeVersion(store)).toBe(1);
  });

  it("persists the whole state under its registered key", () => {
    const storage = new MemoryStoreStorage();
    const store = new UiStore(storage);
    store.setDensity("compact");
    expect(storage.area("prefs").get("console.ui")).toEqual({
      sidebarCollapsed: false,
      density: "compact",
    });
  });

  it("hydrates on a microtask after the field initializers", async () => {
    const storage = new MemoryStoreStorage();
    storage.area("prefs").set("console.ui", { sidebarCollapsed: true, density: "compact" });
    const store = new UiStore(storage);
    expect(store.sidebarCollapsed).toBe(false);
    await Promise.resolve();
    expect(store).toMatchObject({ sidebarCollapsed: true, density: "compact" });
  });

  it("never lets hydration overwrite a field written first", async () => {
    const storage = new MemoryStoreStorage();
    storage.area("prefs").set("console.ui", { sidebarCollapsed: true, density: "compact" });
    const store = new UiStore(storage);
    store.setDensity("spacious");
    await hydrateStore(store);
    expect(store).toMatchObject({ sidebarCollapsed: true, density: "spacious" });
  });

  it("lives in memory without storage, and session-only with storage", () => {
    const storage = new MemoryStoreStorage();
    const palette = new PaletteStore(storage);
    palette.open();
    expect(storage.area("prefs").get("console.palette")).toBeUndefined();
    const ui = new UiStore();
    ui.toggleSidebar();
    expect(ui.sidebarCollapsed).toBe(true);
  });

  it("refuses to build a persisted store with no registered key", () => {
    expect(() => new UnregisteredStore(new MemoryStoreStorage())).toThrow(
      /UnregisteredStore persists but has no registered key/,
    );
    expect(new UnregisteredStore().count).toBe(0);
  });

  it("types the instance as the class and keeps set protected", () => {
    expectTypeOf(new UiStore()).toMatchTypeOf<Store>();
    expectTypeOf<UiStore>().not.toHaveProperty("set");
  });
});
