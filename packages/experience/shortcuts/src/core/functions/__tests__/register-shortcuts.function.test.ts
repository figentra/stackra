/**
 * Stackra file contract:
 * Purpose: unit tests of `registerShortcuts`: entries are recorded from the kind registry in order, registering a class
 *          again replaces it, and a bad key or label, a non-shortcut, a taken key or a conflict throws and registers
 *          nothing of the batch.
 * Boundary: test only; resets `SHORTCUT_ENTRIES` before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 20 and 22); registry v3.1 final review H.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Shortcut } from "#core/bases/shortcut.base";
import { SHORTCUT_ENTRIES } from "#core/constants/shortcut-entries.constant";
import { registerShortcuts } from "#core/functions/register-shortcuts.function";

class OpenPaletteShortcut extends Shortcut({ keys: "mod+k", group: "console::palette.group_app" }) {
  run(): void {}
}

class SignOutShortcut extends Shortcut({
  group: "console::palette.group_account",
  icon: "log-out",
}) {
  run(): void {}
}

class SearchShortcut extends Shortcut({ keys: "meta+k", group: "console::palette.group_app" }) {
  run(): void {}
}

beforeEach(() => {
  SHORTCUT_ENTRIES.clear();
});

describe("registerShortcuts", () => {
  it("records each entry with its options, in order", () => {
    registerShortcuts([
      [OpenPaletteShortcut, "console.open_palette", "shortcuts::open_palette.label"],
      [SignOutShortcut, "console.sign_out", "shortcuts::sign_out.label"],
    ]);
    expect([...SHORTCUT_ENTRIES.values()]).toEqual([
      {
        type: OpenPaletteShortcut,
        key: "console.open_palette",
        label: "shortcuts::open_palette.label",
        group: "console::palette.group_app",
        keys: "mod+k",
        steps: ["mod+k"],
        icon: null,
        intents: [],
      },
      {
        type: SignOutShortcut,
        key: "console.sign_out",
        label: "shortcuts::sign_out.label",
        group: "console::palette.group_account",
        keys: null,
        steps: [],
        icon: "log-out",
        intents: [],
      },
    ]);
  });

  it("replaces the entry of a class registered again", () => {
    registerShortcuts([[SignOutShortcut, "console.sign_out", "shortcuts::sign_out.label"]]);
    registerShortcuts([[SignOutShortcut, "console.log_out", "shortcuts::log_out.label"]]);
    expect([...SHORTCUT_ENTRIES.values()].map((entry) => entry.key)).toEqual(["console.log_out"]);
  });

  it("refuses a key or label not in the derived form", () => {
    expect(() =>
      registerShortcuts([[SignOutShortcut, "SignOut", "shortcuts::sign_out.label"]]),
    ).toThrow(/<member>\.<name>/);
    expect(() => registerShortcuts([[SignOutShortcut, "console.sign_out", "Sign out"]])).toThrow(
      /<namespace>::<path>/,
    );
  });

  it("refuses a class that is not a shortcut", () => {
    class NotAShortcut {
      run(): void {}
    }
    expect(() =>
      registerShortcuts([
        [NotAShortcut as never, "console.not_a_shortcut", "shortcuts::not_a_shortcut.label"],
      ]),
    ).toThrow(TypeError);
  });

  it("refuses a shortcut with no run method", () => {
    class SilentShortcut extends Shortcut({ group: "console::palette.group_app" }) {}
    expect(() =>
      registerShortcuts([[SilentShortcut as never, "console.silent", "shortcuts::silent.label"]]),
    ).toThrow(/no run\(ctx\) method/);
  });

  it("refuses a key another class holds", () => {
    registerShortcuts([[SignOutShortcut, "console.sign_out", "shortcuts::sign_out.label"]]);
    expect(() =>
      registerShortcuts([[OpenPaletteShortcut, "console.sign_out", "shortcuts::sign_out.label"]]),
    ).toThrow(/already SignOutShortcut's/);
  });

  it("refuses a conflict and registers nothing of the batch", () => {
    registerShortcuts([
      [OpenPaletteShortcut, "console.open_palette", "shortcuts::open_palette.label"],
    ]);
    expect(() =>
      registerShortcuts([
        [SignOutShortcut, "console.sign_out", "shortcuts::sign_out.label"],
        [SearchShortcut, "console.search", "shortcuts::search.label"],
      ]),
    ).toThrow(/console\.open_palette \(mod\+k\) and console\.search \(meta\+k\) are same/);
    expect([...SHORTCUT_ENTRIES.keys()]).toEqual([OpenPaletteShortcut]);
  });
});
