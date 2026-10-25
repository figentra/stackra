/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/shortcuts (the palette list and runner, the per-shortcut
 *          handler, the key hint and the keyboard bindings) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Builds on the `.` entry's sources only; the keyboard driver
 *           (TanStack Hotkeys) never leaves this entry.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useRunShortcut } from "#react/run-shortcut/use-run-shortcut";
export { useShortcut } from "#react/shortcut/use-shortcut";
export { ShortcutBindings } from "#react/shortcut-bindings/shortcut-bindings";
export { ShortcutKeys } from "#react/shortcut-keys/shortcut-keys";
export type { ShortcutKeysProps } from "#react/shortcut-keys/shortcut-keys.props";
export type { ShortcutItem } from "#react/shortcuts/shortcut-item.type";
export { useShortcuts } from "#react/shortcuts/use-shortcuts";
