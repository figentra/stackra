/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Shortcut` kind base: the template's shortcuts record their options with the
 *          binding in normal form and the defaults filled in, a bad binding or an empty group is refused at
 *          declaration, constructor injection reaches `run`, and the kind is called only.
 * Boundary: test only; the classes restate the template's `apps/console/src/shortcuts/*.shortcut.ts` with local
 *           stand-ins for its stores.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16, 17,
 *                     23 and 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Shortcut } from "#core/bases/shortcut.base";
import type { ShortcutClass } from "#core/types/shortcut-class.type";

/** A stand-in for the console's palette store. */
class PaletteStore {
  isOpen = false;

  open(): void {
    this.isOpen = true;
  }
}

class OpenPaletteShortcut extends Shortcut({ keys: "mod+k", group: "console::palette.group_app" }) {
  private readonly palette: PaletteStore;

  constructor(palette: PaletteStore) {
    super();
    this.palette = palette;
  }

  run(): void {
    this.palette.open();
  }
}

class SignOutShortcut extends Shortcut({
  group: "console::palette.group_account",
  icon: "log-out",
  intents: ["logout", "leave"],
}) {
  run(): void {}
}

describe("Shortcut", () => {
  it("records a binding in normal form with the defaults filled in", () => {
    expect(kindOf(OpenPaletteShortcut)).toEqual({
      kind: "shortcut",
      options: { keys: "mod+k", group: "console::palette.group_app", icon: null, intents: [] },
    });
  });

  it("records a palette-only entry with its icon and search words", () => {
    expect(kindOf(SignOutShortcut)?.options).toEqual({
      keys: null,
      group: "console::palette.group_account",
      icon: "log-out",
      intents: ["logout", "leave"],
    });
  });

  it("normalises the binding it records", () => {
    class CycleThemeShortcut extends Shortcut({ keys: "Shift+Mod+L", group: "g::a" }) {
      run(): void {}
    }
    class GoToSettingsShortcut extends Shortcut({ keys: " g   s ", group: "g::a" }) {
      run(): void {}
    }
    expect(kindOf(CycleThemeShortcut)?.options["keys"]).toBe("mod+shift+l");
    expect(kindOf(GoToSettingsShortcut)?.options["keys"]).toBe("g s");
  });

  it("refuses a bad binding or an empty group where it is declared", () => {
    expect(() => Shortcut({ keys: "mod+", group: "g::a" })).toThrow(RangeError);
    expect(() => Shortcut({ keys: "hyper+k", group: "g::a" })).toThrow(RangeError);
    expect(() => Shortcut({ group: "  " })).toThrow(/palette group/);
  });

  it("injects through the constructor and runs", async () => {
    const palette = new PaletteStore();
    await new OpenPaletteShortcut(palette).run();
    expect(palette.isOpen).toBe(true);
  });

  it("keeps instanceof and a class per call", () => {
    expect(new SignOutShortcut()).toBeInstanceOf(Shortcut);
    expect(Object.getPrototypeOf(SignOutShortcut)).not.toBe(
      Object.getPrototypeOf(OpenPaletteShortcut),
    );
    expect((Shortcut as unknown as { name: string }).name).toBe("Shortcut");
  });

  it("is called only and returns a ShortcutClass", () => {
    expectTypeOf(Shortcut).returns.toEqualTypeOf<ShortcutClass>();
    expectTypeOf<SignOutShortcut["~kind"]>().toEqualTypeOf<"shortcut">();
  });
});
