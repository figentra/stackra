/**
 * Stackra file contract:
 * Purpose: unit tests of the shortcut-aware UI's pure parts: `shortcutStepOf` (physical keys, an Arabic layout),
 *          `resolveShortcutSettings` (layers and locks), reserved conflicts, `toAriaKeyShortcuts`, `flipShortcutKeys`,
 *          `effectiveShortcutKeys` and the plain and character step checks.
 * Boundary: test only; pure functions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0508.
 */
import { describe, expect, it } from "@stackra/testing";

import { effectiveShortcutKeys } from "#core/functions/effective-shortcut-keys.function";
import { findShortcutConflicts } from "#core/functions/find-shortcut-conflicts.function";
import { flipShortcutKeys } from "#core/functions/flip-shortcut-keys.function";
import { isCharacterShortcutStep } from "#core/functions/is-character-shortcut-step.function";
import { isPlainShortcutStep } from "#core/functions/is-plain-shortcut-step.function";
import { resolveShortcutSettings } from "#core/functions/resolve-shortcut-settings.function";
import { shortcutStepOf } from "#core/functions/shortcut-step-of.function";
import { toAriaKeyShortcuts } from "#core/functions/to-aria-key-shortcuts.function";

const press = (
  code: string,
  key: string,
  mods: Partial<Record<"meta" | "ctrl" | "alt" | "shift", boolean>> = {},
) => ({
  code,
  key,
  metaKey: mods.meta ?? false,
  ctrlKey: mods.ctrl ?? false,
  altKey: mods.alt ?? false,
  shiftKey: mods.shift ?? false,
});

describe("shortcutStepOf", () => {
  it("reads the physical key, so an Arabic layout matches the Latin binding", () => {
    expect(shortcutStepOf(press("KeyK", "ن", { meta: true }))).toBe("meta+k");
    expect(shortcutStepOf(press("Slash", "?", { shift: true }))).toBe("shift+/");
    expect(shortcutStepOf(press("Digit3", "٣", { ctrl: true }))).toBe("ctrl+3");
    expect(shortcutStepOf(press("ArrowLeft", "ArrowLeft", { meta: true }))).toBe("meta+left");
    expect(shortcutStepOf(press("F5", "F5"))).toBe("f5");
  });

  it("ignores a bare modifier and falls back to the typed key without a code", () => {
    expect(shortcutStepOf(press("MetaLeft", "Meta", { meta: true }))).toBeUndefined();
    expect(shortcutStepOf(press("", "e"))).toBe("e");
    expect(shortcutStepOf(press("", "Escape"))).toBe("escape");
    expect(shortcutStepOf(press("", "Shift", { shift: true }))).toBeUndefined();
  });
});

describe("resolveShortcutSettings", () => {
  it("folds platform, tenant and person, and a lock keeps the tenant's value", () => {
    const settings = resolveShortcutSettings(
      { hintMode: "hidden", remaps: { a: "mod+1" }, locked: ["hintMode"] },
      { hintMode: "visible", singleKey: false, remaps: { b: null } },
    );
    expect(settings).toEqual({
      enabled: true,
      hintMode: "hidden",
      singleKey: false,
      remaps: { a: "mod+1", b: null },
      locked: ["hintMode"],
    });
    expect(resolveShortcutSettings(undefined).hintMode).toBe("visible");
  });
});

describe("reserved conflicts", () => {
  it("reports a browser key only when asked", () => {
    const shortcuts = [{ key: "app.close", keys: "mod+w" }];
    expect(findShortcutConflicts(shortcuts)).toEqual([]);
    expect(findShortcutConflicts(shortcuts, { reserved: true })).toEqual([
      { kind: "reserved", shortcuts: ["app.close", "reserved"], keys: ["mod+w", "mod+w"] },
    ]);
    expect(findShortcutConflicts([{ key: "x", keys: "ctrl+w" }], { reserved: true })).toHaveLength(
      1,
    );
  });
});

describe("display helpers", () => {
  it("writes aria-keyshortcuts per platform, none for a chord", () => {
    expect(toAriaKeyShortcuts("mod+k", true)).toBe("Meta+K");
    expect(toAriaKeyShortcuts("mod+shift+l", false)).toBe("Control+Shift+L");
    expect(toAriaKeyShortcuts("space", false)).toBe("Space");
    expect(toAriaKeyShortcuts("g s", false)).toBeUndefined();
  });

  it("mirrors arrows and applies remaps", () => {
    expect(flipShortcutKeys("mod+right")).toBe("mod+left");
    const settings = { remaps: { b: "mod+2", c: null } };
    expect(
      effectiveShortcutKeys(
        { id: "a", shortcut: "Mod+Right", isDirectional: true },
        settings,
        true,
      ),
    ).toBe("mod+left");
    expect(effectiveShortcutKeys({ id: "b", shortcut: "mod+1" }, settings, false)).toBe("mod+2");
    expect(effectiveShortcutKeys({ id: "c", shortcut: "mod+1" }, settings, false)).toBeUndefined();
    expect(effectiveShortcutKeys({ id: "d", shortcut: "⌘E" }, settings, false)).toBeUndefined();
  });

  it("tells plain and character steps apart", () => {
    expect(isPlainShortcutStep("e")).toBe(true);
    expect(isPlainShortcutStep("left")).toBe(true);
    expect(isPlainShortcutStep("escape")).toBe(false);
    expect(isPlainShortcutStep("mod+enter")).toBe(false);
    expect(isCharacterShortcutStep("shift+/")).toBe(true);
    expect(isCharacterShortcutStep("left")).toBe(false);
    expect(isCharacterShortcutStep("mod+e")).toBe(false);
  });
});
