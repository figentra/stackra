/**
 * Stackra file contract:
 * Purpose: unit tests of `findShortcutConflicts`: the template's five bindings do not clash; the same keys (also
 *          through `mod` on either platform) and a chord prefix do, each pair reported once with its kind.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; registry v3.1 final review H (gen conflict checks).
 */
import { describe, expect, it } from "@stackra/testing";

import { findShortcutConflicts } from "#core/functions/find-shortcut-conflicts.function";

describe("findShortcutConflicts", () => {
  it("finds nothing among the template's bindings", () => {
    expect(
      findShortcutConflicts([
        { key: "console.open_palette", keys: "mod+k" },
        { key: "console.toggle_sidebar", keys: "mod+b" },
        { key: "console.cycle_theme", keys: "mod+shift+l" },
      ]),
    ).toEqual([]);
  });

  it("reports the same keys, however they are spelled", () => {
    expect(
      findShortcutConflicts([
        { key: "console.open_palette", keys: "mod+shift+k" },
        // The key must come last; case and modifier order are free.
        { key: "loyalty.search", keys: "Shift+Mod+K" },
      ]),
    ).toEqual([
      {
        kind: "same",
        shortcuts: ["console.open_palette", "loyalty.search"],
        keys: ["mod+shift+k", "mod+shift+k"],
      },
    ]);
  });

  it("resolves mod per platform", () => {
    const [onApple] = findShortcutConflicts([
      { key: "console.open_palette", keys: "mod+k" },
      { key: "console.search", keys: "meta+k" },
    ]);
    const [elsewhere] = findShortcutConflicts([
      { key: "console.open_palette", keys: "mod+k" },
      { key: "console.search", keys: "ctrl+k" },
    ]);
    expect(onApple?.kind).toBe("same");
    expect(elsewhere?.kind).toBe("same");
    expect(
      findShortcutConflicts([
        { key: "console.a", keys: "ctrl+k" },
        { key: "console.b", keys: "meta+k" },
      ]),
    ).toEqual([]);
  });

  it("reports a binding that starts another's chord", () => {
    expect(
      findShortcutConflicts([
        { key: "console.go_to_settings", keys: "g s" },
        { key: "console.go", keys: "g" },
        { key: "console.go_to_orders", keys: "g o" },
      ]),
    ).toEqual([
      { kind: "prefix", shortcuts: ["console.go_to_settings", "console.go"], keys: ["g s", "g"] },
      { kind: "prefix", shortcuts: ["console.go", "console.go_to_orders"], keys: ["g", "g o"] },
    ]);
  });

  it("throws on a binding that is not one", () => {
    expect(() => findShortcutConflicts([{ key: "console.bad", keys: "mod+" }])).toThrow(RangeError);
  });
});
