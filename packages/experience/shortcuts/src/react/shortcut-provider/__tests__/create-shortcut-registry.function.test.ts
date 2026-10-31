/**
 * Stackra file contract:
 * Purpose: unit tests of `createShortcutRegistry`: scopes (page paused under an overlay, the topmost overlay answers,
 *          focus), the typing guard, IME composition, single-key off, two-key sequences, `when`, disabled and refused
 *          actions, remaps, the run-by-id and the hold-Mod reveal.
 * Boundary: test only; jsdom for the typing targets and fake timers for the reveal.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DEFAULT_SHORTCUT_SETTINGS } from "#core/constants/default-shortcut-settings.constant";
import type { ShortcutAction } from "#core/types/shortcut-action.type";
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";
import { REVEAL_DELAY } from "#core/constants/reveal-delay.constant";
import { createShortcutRegistry } from "#react/shortcut-provider/create-shortcut-registry.function";

let settings: ShortcutSettings = DEFAULT_SHORTCUT_SETTINGS;
const registry = () =>
  createShortcutRegistry(() => ({ settings, apple: true, rtl: false, can: (p) => p !== "no" }));

const key = (code: string, typed: string, extra: Record<string, unknown> = {}) => ({
  code,
  key: typed,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  target: document.body,
  preventDefault: vi.fn(),
  ...extra,
});

const action = (id: string, shortcut: string, run = vi.fn(), extra: Partial<ShortcutAction> = {}) =>
  ({ id, label: id, shortcut, run, ...extra }) satisfies ShortcutAction;

afterEach(() => {
  settings = DEFAULT_SHORTCUT_SETTINGS;
  vi.useRealTimers();
});

describe("createShortcutRegistry", () => {
  it("runs a page action, pauses it under an overlay, and the topmost overlay answers", () => {
    const shortcuts = registry();
    const page = action("page.save", "mod+enter");
    const dialog = action("dialog.confirm", "mod+enter");
    const app = action("app.palette", "mod+k");
    shortcuts.register({ action: () => page, scope: "page", overlay: null });
    shortcuts.register({ action: () => app, scope: "app", overlay: null });
    shortcuts.register({ action: () => dialog, scope: "overlay", overlay: 7 });
    const first = key("Enter", "Enter", { metaKey: true });
    expect(shortcuts.keyDown(first, 0)).toBe(true);
    expect(page.run).toHaveBeenCalledTimes(1);
    expect(first.preventDefault).toHaveBeenCalled();
    const close = shortcuts.pushOverlay(7);
    shortcuts.keyDown(key("Enter", "Enter", { metaKey: true }), 0);
    expect(dialog.run).toHaveBeenCalledTimes(1);
    expect(page.run).toHaveBeenCalledTimes(1);
    shortcuts.keyDown(key("KeyK", "ن", { metaKey: true }), 0);
    expect(app.run).toHaveBeenCalledTimes(1);
    close();
    shortcuts.keyDown(key("Enter", "Enter", { metaKey: true }), 0);
    expect(page.run).toHaveBeenCalledTimes(2);
  });

  it("keeps plain keys for text fields, skips IME composition, honours single-key off", () => {
    const shortcuts = registry();
    const edit = action("row.edit", "e");
    const save = action("doc.save", "mod+s");
    shortcuts.register({ action: () => edit, scope: "page", overlay: null });
    shortcuts.register({ action: () => save, scope: "page", overlay: null });
    const input = document.createElement("input");
    expect(shortcuts.keyDown(key("KeyE", "e", { target: input }), 0)).toBe(false);
    shortcuts.keyDown(key("KeyS", "s", { metaKey: true, target: input }), 0);
    expect(save.run).toHaveBeenCalledTimes(1);
    expect(shortcuts.keyDown(key("KeyE", "e", { isComposing: true }), 0)).toBe(false);
    settings = { ...DEFAULT_SHORTCUT_SETTINGS, singleKey: false };
    expect(shortcuts.keyDown(key("KeyE", "e"), 0)).toBe(false);
    settings = DEFAULT_SHORTCUT_SETTINGS;
    shortcuts.keyDown(key("KeyE", "e"), 0);
    expect(edit.run).toHaveBeenCalledTimes(1);
  });

  it("runs a two-key sequence within the chord timeout only", () => {
    const shortcuts = registry();
    const go = action("go.settings", "g s");
    shortcuts.register({ action: () => go, scope: "page", overlay: null });
    expect(shortcuts.keyDown(key("KeyG", "g"), 0)).toBe(true);
    shortcuts.keyDown(key("KeyS", "s"), 100);
    expect(go.run).toHaveBeenCalledTimes(1);
    shortcuts.keyDown(key("KeyG", "g"), 0);
    shortcuts.keyDown(key("KeyS", "s"), 5000);
    expect(go.run).toHaveBeenCalledTimes(1);
  });

  it("skips disabled, refused and `when`-false actions, applies remaps, and lists the rest", () => {
    const shortcuts = registry();
    const off = action("a.off", "mod+1", vi.fn(), { isDisabled: true });
    const refused = action("a.refused", "mod+2", vi.fn(), { permission: "no" });
    const later = action("a.later", "mod+3", vi.fn(), { when: () => false });
    const moved = action("a.moved", "mod+4");
    for (const one of [off, refused, later, moved])
      shortcuts.register({ action: () => one, scope: "page", overlay: null });
    settings = { ...DEFAULT_SHORTCUT_SETTINGS, remaps: { "a.moved": "mod+5" } };
    shortcuts.keyDown(key("Digit1", "1", { metaKey: true }), 0);
    shortcuts.keyDown(key("Digit2", "2", { metaKey: true }), 0);
    expect(shortcuts.keyDown(key("Digit3", "3", { metaKey: true }), 0)).toBe(false);
    shortcuts.keyDown(key("Digit4", "4", { metaKey: true }), 0);
    shortcuts.keyDown(key("Digit5", "5", { metaKey: true }), 0);
    expect(off.run).not.toHaveBeenCalled();
    expect(refused.run).not.toHaveBeenCalled();
    expect(moved.run).toHaveBeenCalledTimes(1);
    expect(shortcuts.list().map((one) => [one.id, one.keys])).toEqual([
      ["a.later", "mod+3"],
      ["a.moved", "mod+5"],
    ]);
    expect(shortcuts.run("a.moved")).toBe(true);
    expect(shortcuts.run("a.off")).toBe(false);
  });

  it("answers a focus-scoped action only while focus is inside its element", () => {
    const shortcuts = registry();
    const box = document.createElement("div");
    const inner = document.createElement("button");
    box.append(inner);
    const next = action("media.next", "right");
    shortcuts.register({
      action: () => next,
      scope: "focus",
      overlay: null,
      within: { current: box },
    });
    shortcuts.keyDown(key("ArrowRight", "ArrowRight"), 0);
    shortcuts.keyDown(key("ArrowRight", "ArrowRight", { target: inner }), 0);
    expect(next.run).toHaveBeenCalledTimes(1);
  });

  it("reveals the badges after Mod is held alone, and hides them on release or another key", () => {
    vi.useFakeTimers();
    const shortcuts = registry();
    const seen = vi.fn();
    shortcuts.subscribeView(seen);
    shortcuts.keyDown(key("MetaLeft", "Meta", { metaKey: true }), 0);
    expect(shortcuts.isRevealed()).toBe(false);
    expect(shortcuts.hasKeyboard()).toBe(true);
    vi.advanceTimersByTime(REVEAL_DELAY);
    expect(shortcuts.isRevealed()).toBe(true);
    shortcuts.keyUp("Meta");
    expect(shortcuts.isRevealed()).toBe(false);
    shortcuts.keyDown(key("MetaLeft", "Meta", { metaKey: true }), 0);
    shortcuts.keyDown(key("KeyK", "k", { metaKey: true }), 0);
    vi.advanceTimersByTime(REVEAL_DELAY);
    expect(shortcuts.isRevealed()).toBe(false);
    expect(seen).toHaveBeenCalled();
  });
});
