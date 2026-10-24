/**
 * Stackra file contract:
 * Purpose: unit tests of `storeKeyOf`: the registered key of a class, the nearest registered ancestor's key for a
 *          subclass, and a throw naming the class and the fix when nothing is registered.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { Store } from "#core/bases/store.base";
import { registerStores } from "#core/functions/register-stores.function";
import { storeKeyOf } from "#core/functions/store-key-of.function";

class UiStore extends Store({ persist: "prefs" }) {
  density = "comfortable";
}

class TestUiStore extends UiStore {}

class LooseStore extends Store({ persist: "prefs" }) {
  value = 0;
}

registerStores([[UiStore, "console.ui"]]);

describe("storeKeyOf", () => {
  it("returns the registered key, inherited by a subclass", () => {
    expect(storeKeyOf(UiStore)).toBe("console.ui");
    expect(storeKeyOf(TestUiStore)).toBe("console.ui");
  });

  it("throws naming the class and the fix when nothing is registered", () => {
    expect(() => storeKeyOf(LooseStore)).toThrow(
      /LooseStore persists but has no registered key: run `stackra gen`.*registerStores\(\[\[LooseStore/,
    );
  });
});
