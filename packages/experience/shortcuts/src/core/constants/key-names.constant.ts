/**
 * Stackra file contract:
 * Purpose: `KEY_NAMES`, every named key and modifier a key binding may use, with how each is shown, spoken and handed
 *          to the keyboard driver. A key binding's other keys are single printable characters (`k`, `/`, `=`).
 * Boundary: data only; lower-case names are the spelling a binding uses (`escape`, `pageup`, `f5`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23); registry v3.1 R-66 (display is ours, the driver is TanStack Hotkeys).
 */
import type { KeyName } from "#core/types/key-name.type";

/** A key that looks and sounds the same everywhere. */
const same = (hotkey: string, text: string, words: string): KeyName => ({
  hotkey,
  apple: text,
  other: text,
  appleWords: words,
  otherWords: words,
});

/** The function keys `f1` to `f12`. */
const FUNCTION_KEYS = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const name = `F${index + 1}`;
    return [name.toLowerCase(), same(name, name, name)];
  }),
);

/** The named keys and modifiers, by the name a binding spells. */
export const KEY_NAMES: Readonly<Record<string, KeyName>> = Object.freeze({
  mod: { hotkey: "Mod", apple: "⌘", other: "Ctrl", appleWords: "Command", otherWords: "Control" },
  ctrl: {
    hotkey: "Control",
    apple: "⌃",
    other: "Ctrl",
    appleWords: "Control",
    otherWords: "Control",
  },
  alt: { hotkey: "Alt", apple: "⌥", other: "Alt", appleWords: "Option", otherWords: "Alt" },
  shift: { hotkey: "Shift", apple: "⇧", other: "Shift", appleWords: "Shift", otherWords: "Shift" },
  meta: { hotkey: "Meta", apple: "⌘", other: "Win", appleWords: "Command", otherWords: "Windows" },
  escape: same("Escape", "Esc", "Escape"),
  enter: { hotkey: "Enter", apple: "↩", other: "Enter", appleWords: "Return", otherWords: "Enter" },
  tab: { hotkey: "Tab", apple: "⇥", other: "Tab", appleWords: "Tab", otherWords: "Tab" },
  space: same("Space", "Space", "Space"),
  backspace: {
    hotkey: "Backspace",
    apple: "⌫",
    other: "Backspace",
    appleWords: "Delete",
    otherWords: "Backspace",
  },
  delete: {
    hotkey: "Delete",
    apple: "⌦",
    other: "Del",
    appleWords: "Forward Delete",
    otherWords: "Delete",
  },
  up: same("ArrowUp", "↑", "Up"),
  down: same("ArrowDown", "↓", "Down"),
  left: same("ArrowLeft", "←", "Left"),
  right: same("ArrowRight", "→", "Right"),
  home: same("Home", "Home", "Home"),
  end: same("End", "End", "End"),
  pageup: same("PageUp", "PgUp", "Page Up"),
  pagedown: same("PageDown", "PgDn", "Page Down"),
  ...FUNCTION_KEYS,
});
