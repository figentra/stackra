/**
 * Stackra file contract:
 * Purpose: unit and type tests of `mountStore`: the template's `UiStore` case (toggle, a derived class from enum case
 *          data, the density persisted as its code under `console.ui`), synchronous mounting, the area of a store
 *          persisting elsewhere, a session-only store's empty `prefs`, and the throw for an unregistered persisted
 *          store.
 * Boundary: test only; the template's `apps/console/src/stores/ui.store.ts` with a local `Density` enum built by
 *           `Enum.of` and the storage enum replaced by its code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0079; ADR 0256.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { registerStores, Store } from "#core/index";
import { mountStore } from "#testing/functions/mount-store.function";

const Density = Enum.of({
  Comfortable: ["comfortable", { className: "panel-comfortable" }],
  Compact: ["compact", { className: "panel-compact" }],
});
type Density = Enum.Value<typeof Density>;

class UiStore extends Store({ persist: "prefs" }) {
  sidebarCollapsed = false;

  density: Density = Density.Comfortable;

  toggleSidebar(): void {
    this.set({ sidebarCollapsed: !this.sidebarCollapsed });
  }

  setDensity(density: Density): void {
    this.set({ density });
  }

  get densityClass(): string {
    return Enum.meta(Density, this.density).className;
  }
}

class DraftStore extends Store({ persist: "session" }) {
  text = "";

  write(text: string): void {
    this.set({ text });
  }
}

class PaletteStore extends Store {
  isOpen = false;
}

class OrphanStore extends Store({ persist: "prefs" }) {
  value = 0;
}

registerStores([
  [UiStore, "console.ui"],
  [DraftStore, "console.draft"],
]);

describe("mountStore", () => {
  it("derives the density class and persists the density as its code", () => {
    const { store, prefs } = mountStore(UiStore);
    store.setDensity(Density.Compact);
    expect(store.densityClass).toBe("panel-compact");
    expect(prefs.get("console.ui")).toMatchObject({ density: "compact" });
    expectTypeOf(store).toEqualTypeOf<UiStore>();
  });

  it("toggles the sidebar synchronously after mounting", () => {
    const { store } = mountStore(UiStore);
    store.toggleSidebar();
    expect(store.sidebarCollapsed).toBe(true);
  });

  it("hands back the area a store persists into", () => {
    const { store, prefs } = mountStore(DraftStore);
    store.write("hello");
    expect(prefs.get("console.draft")).toEqual({ text: "hello" });
  });

  it("gives a session-only store an empty prefs area", () => {
    const { store, prefs } = mountStore(PaletteStore);
    expect(store.isOpen).toBe(false);
    expect(prefs.get("console.palette")).toBeUndefined();
  });

  it("throws for a persisted store with no registered key", () => {
    expect(() => mountStore(OrphanStore)).toThrow(/OrphanStore persists but has no registered key/);
  });
});
