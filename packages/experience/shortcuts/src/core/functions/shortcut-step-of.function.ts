/**
 * Stackra file contract:
 * Purpose: `shortcutStepOf`, the step a key press is, in resolved form (`meta+k` for Command+K on a Mac, `ctrl+k` for
 *          Control+K elsewhere), read from the physical key (`event.code`) so every keyboard layout matches the same
 *          bindings, with Latin labels; `undefined` for a bare modifier press.
 * Boundary: pure; compare it with `resolveShortcutStep` of a binding's step. Falls back to `event.key` when the code is
 *           unknown (some virtual keyboards).
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (matching on `event.code`).
 */
import { KEY_CODES } from "#core/constants/key-codes.constant";
import { KEY_NAMES } from "#core/constants/key-names.constant";
import type { ShortcutKeyEvent } from "#core/types/shortcut-key-event.type";

/** The binding name of a physical key, or `undefined` for a modifier or a key no binding names. */
function nameOf(event: ShortcutKeyEvent): string | undefined {
  const code = event.code ?? "";
  const letter = /^Key([A-Z])$/.exec(code)?.[1];
  if (letter !== undefined) return letter.toLowerCase();
  const digit = /^(?:Digit|Numpad)([0-9])$/.exec(code)?.[1];
  if (digit !== undefined) return digit;
  if (/^F(?:[1-9]|1[0-2])$/.test(code)) return code.toLowerCase();
  if (KEY_CODES[code] !== undefined) return KEY_CODES[code];
  if (code !== "") return undefined;
  const key = event.key.toLowerCase();
  const named = Object.entries(KEY_NAMES).find(([, value]) => value.hotkey.toLowerCase() === key);
  if (named !== undefined)
    return ["mod", "ctrl", "alt", "shift", "meta"].includes(named[0]) ? undefined : named[0];
  return key.length === 1 ? key : undefined;
}

/**
 * The resolved step of a key press.
 *
 * @example
 * shortcutStepOf({ code: "KeyK", key: "ن", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }); // "meta+k"
 */
export function shortcutStepOf(event: ShortcutKeyEvent): string | undefined {
  const name = nameOf(event);
  if (name === undefined) return undefined;
  return [
    event.ctrlKey ? "ctrl" : "",
    event.altKey ? "alt" : "",
    event.shiftKey ? "shift" : "",
    event.metaKey ? "meta" : "",
    name,
  ]
    .filter((part) => part !== "")
    .join("+");
}
