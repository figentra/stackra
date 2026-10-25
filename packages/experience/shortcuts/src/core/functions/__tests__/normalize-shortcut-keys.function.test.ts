/**
 * Stackra file contract:
 * Purpose: unit tests of `normalizeShortcutKeys`: case, modifier order, named keys, punctuation and chords are read
 *          into normal form, and every malformed binding is refused with a `RangeError`.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; registry v3.1 final review H (chord sequences).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";

describe("normalizeShortcutKeys", () => {
  it("lower-cases and orders the modifiers", () => {
    expect(normalizeShortcutKeys("mod+k")).toEqual(["mod+k"]);
    expect(normalizeShortcutKeys("Shift+Mod+L")).toEqual(["mod+shift+l"]);
    expect(normalizeShortcutKeys("meta+shift+alt+ctrl+p")).toEqual(["ctrl+alt+shift+meta+p"]);
  });

  it("accepts named keys and punctuation", () => {
    expect(normalizeShortcutKeys("Escape")).toEqual(["escape"]);
    expect(normalizeShortcutKeys("shift+PageUp")).toEqual(["shift+pageup"]);
    expect(normalizeShortcutKeys("mod+/")).toEqual(["mod+/"]);
    expect(normalizeShortcutKeys("mod+F12")).toEqual(["mod+f12"]);
  });

  it("splits a chord into steps on any run of spaces", () => {
    expect(normalizeShortcutKeys("  g   S ")).toEqual(["g", "s"]);
    expect(normalizeShortcutKeys("mod+k mod+s")).toEqual(["mod+k", "mod+s"]);
  });

  it("refuses what is not a binding", () => {
    for (const keys of [
      "",
      "   ",
      "mod",
      "mod+",
      "k+j",
      "hyper+k",
      "shift+shift+k",
      "mod+ctrl+k",
      "mod+meta+k",
      "f13",
      "mod+enterr",
    ])
      expect(() => normalizeShortcutKeys(keys), keys).toThrow(RangeError);
  });
});
