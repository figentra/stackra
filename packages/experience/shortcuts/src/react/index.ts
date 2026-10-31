/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/shortcuts (the palette list and runner, the per-shortcut
 *          handler, the key hint and the keyboard bindings; and the shortcut-aware UI's provider, scope and hooks)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Builds on the `.` entry's sources only; the keyboard driver
 *           (TanStack Hotkeys) never leaves this entry.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0508.
 */
export { useRunShortcut } from "#react/run-shortcut/use-run-shortcut";
export type { ShortcutHintState } from "#react/shortcut-action/shortcut-hint-state.type";
export { useShortcutAction } from "#react/shortcut-action/use-shortcut-action";
export { useShortcutActions } from "#react/shortcut-action/use-shortcut-actions";
export { useShortcutHint } from "#react/shortcut-action/use-shortcut-hint";
export { useShortcut } from "#react/shortcut/use-shortcut";
export { ShortcutBindings } from "#react/shortcut-bindings/shortcut-bindings";
export { ShortcutKeys } from "#react/shortcut-keys/shortcut-keys";
export type { ShortcutKeysProps } from "#react/shortcut-keys/shortcut-keys.props";
export type { RegisteredShortcut } from "#react/shortcut-provider/registered-shortcut.type";
export { ShortcutProvider } from "#react/shortcut-provider/shortcut-provider";
export type { ShortcutProviderProps } from "#react/shortcut-provider/shortcut-provider.props";
export type { ShortcutRegistryState } from "#react/shortcut-registry/shortcut-registry-state.type";
export { useShortcutRegistry } from "#react/shortcut-registry/use-shortcut-registry";
export { ShortcutOverlayScope } from "#react/shortcut-overlay-scope/shortcut-overlay-scope";
export type { ShortcutItem } from "#react/shortcuts/shortcut-item.type";
export { useShortcuts } from "#react/shortcuts/use-shortcuts";
