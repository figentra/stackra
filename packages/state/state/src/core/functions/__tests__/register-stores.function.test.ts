/**
 * Stackra file contract:
 * Purpose: unit and type tests of `registerStores`: it links classes to `<member>.<name>` keys (snake_case member keys
 *          included), a later call replaces a key, a malformed key throws, and only store classes type-check.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 20 and 22).
 */
import { describe, expect, it } from "@stackra/testing";

import { Store } from "#core/bases/store.base";
import { registerStores } from "#core/functions/register-stores.function";
import { storeKeyOf } from "#core/functions/store-key-of.function";

class UiStore extends Store({ persist: "prefs" }) {
  density = "comfortable";
}

class PaletteStore extends Store {
  isOpen = false;
}

describe("registerStores", () => {
  it("links each class to its key, a later call replacing it", () => {
    registerStores([
      [UiStore, "console.ui"],
      [PaletteStore, "loyalty_kit.palette"],
    ]);
    expect(storeKeyOf(UiStore)).toBe("console.ui");
    expect(storeKeyOf(PaletteStore)).toBe("loyalty_kit.palette");
    registerStores([[UiStore, "console.shell_ui"]]);
    expect(storeKeyOf(UiStore)).toBe("console.shell_ui");
  });

  it("refuses a key that is not <member>.<name> in snake_case", () => {
    for (const key of ["ui", "Console.ui", "console.densityMode", "console..ui", "console.ui."])
      expect(() => registerStores([[UiStore, key]])).toThrow(RangeError);
  });

  it("accepts store classes only", () => {
    class NotAStore {
      value = 0;
    }
    // @ts-expect-error -- a class that does not extend Store is refused
    registerStores([[NotAStore, "console.not_a_store"]]);
  });
});
