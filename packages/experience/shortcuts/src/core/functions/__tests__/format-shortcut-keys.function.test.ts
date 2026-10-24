/**
 * Stackra file contract:
 * Purpose: unit tests of `formatShortcutKeys`: Apple glyphs run together and other platforms join names with `+`,
 *          chords give one text per step, and the spoken form names every key.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; registry v3.1 R-66 (display is ours).
 */
import { describe, expect, it } from "@stackra/testing";

import { formatShortcutKeys } from "#core/functions/format-shortcut-keys.function";

describe("formatShortcutKeys", () => {
  it("draws Apple glyphs run together", () => {
    expect(formatShortcutKeys("mod+shift+l", true)).toEqual({
      steps: ["⌘⇧L"],
      spoken: "Command Shift L",
    });
  });

  it("draws names joined by + elsewhere", () => {
    expect(formatShortcutKeys("mod+shift+l", false)).toEqual({
      steps: ["Ctrl+Shift+L"],
      spoken: "Control Shift L",
    });
    expect(formatShortcutKeys("alt+up", false)).toEqual({ steps: ["Alt+↑"], spoken: "Alt Up" });
  });

  it("gives one text per chord step", () => {
    expect(formatShortcutKeys("g s", true)).toEqual({ steps: ["G", "S"], spoken: "G, then S" });
    expect(formatShortcutKeys("mod+k escape", false)).toEqual({
      steps: ["Ctrl+K", "Esc"],
      spoken: "Control K, then Escape",
    });
  });

  it("throws on a binding that is not one", () => {
    expect(() => formatShortcutKeys("mod+", true)).toThrow(RangeError);
  });
});
