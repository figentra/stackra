/**
 * Stackra file contract:
 * Purpose: unit tests of `toHotkey`: modifiers, named keys, letters and punctuation take the driver's spelling.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; registry v3.1 R-66.
 */
import { describe, expect, it } from "@stackra/testing";

import { toHotkey } from "#react/shortcut-bindings/to-hotkey.function";

describe("toHotkey", () => {
  it("spells a step the driver's way", () => {
    expect(toHotkey("mod+shift+l")).toBe("Mod+Shift+L");
    expect(toHotkey("ctrl+alt+meta+k")).toBe("Control+Alt+Meta+K");
    expect(toHotkey("pageup")).toBe("PageUp");
    expect(toHotkey("shift+up")).toBe("Shift+ArrowUp");
    expect(toHotkey("mod+/")).toBe("Mod+/");
    expect(toHotkey("f5")).toBe("F5");
  });
});
