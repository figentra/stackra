/**
 * Stackra file contract:
 * Purpose: `KEY_CODES`, the binding name of each physical key (`KeyK` is `k`, `Slash` is `/`, `ArrowLeft` is
 *          `left`), so a shortcut matches the key's place, not the character a layout types there: `mod+k` still fires
 *          on an Arabic layout, where that key types `ن`.
 * Boundary: data only; letters, digits and function keys are derived in `shortcutStepOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (matching on `event.code`).
 */

/** Binding names of the non-letter physical keys. */
export const KEY_CODES: Readonly<Record<string, string>> = Object.freeze({
  Slash: "/",
  Backslash: "\\",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Backquote: "`",
  Escape: "escape",
  Enter: "enter",
  NumpadEnter: "enter",
  Tab: "tab",
  Space: "space",
  Backspace: "backspace",
  Delete: "delete",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
});
