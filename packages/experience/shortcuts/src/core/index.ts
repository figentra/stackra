/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/shortcuts (the `Shortcut` kind, the open `ShortcutContext` and
 *          the way packages contribute to it, the conflict detector and the wiring's `registerShortcuts`, and the
 *          shortcut-aware UI's pure parts: parsing, display, matching, the settings layers) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The registry state stays internal; the palette list, the hooks,
 *           the provider and the key hint are `./react`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note; ADR 0508.
 */
export { Shortcut } from "#core/bases/shortcut.base";
export { DEFAULT_SHORTCUT_SETTINGS } from "#core/constants/default-shortcut-settings.constant";
export { RESERVED_SHORTCUTS } from "#core/constants/reserved-shortcuts.constant";
export { STANDARD_SHORTCUTS } from "#core/constants/standard-shortcuts.constant";
export { ShortcutConflictKind } from "#core/enums/shortcut-conflict-kind.enum";
export { ShortcutHintMode } from "#core/enums/shortcut-hint-mode.enum";
export { ShortcutScope } from "#core/enums/shortcut-scope.enum";
export { contributeShortcutContext } from "#core/functions/contribute-shortcut-context.function";
export { effectiveShortcutKeys } from "#core/functions/effective-shortcut-keys.function";
export { findShortcutConflicts } from "#core/functions/find-shortcut-conflicts.function";
export { flipShortcutKeys } from "#core/functions/flip-shortcut-keys.function";
export { formatShortcutKeys } from "#core/functions/format-shortcut-keys.function";
export { isApplePlatform } from "#core/functions/is-apple-platform.function";
export { isCharacterShortcutStep } from "#core/functions/is-character-shortcut-step.function";
export { isPlainShortcutStep } from "#core/functions/is-plain-shortcut-step.function";
export { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";
export { registerShortcuts } from "#core/functions/register-shortcuts.function";
export { resolveShortcutSettings } from "#core/functions/resolve-shortcut-settings.function";
export { resolveShortcutStep } from "#core/functions/resolve-shortcut-step.function";
export { shortcutStepOf } from "#core/functions/shortcut-step-of.function";
export { toAriaKeyShortcuts } from "#core/functions/to-aria-key-shortcuts.function";
export type { RunnableShortcut } from "#core/types/runnable-shortcut.type";
export type { ShortcutAction } from "#core/types/shortcut-action.type";
export type { ShortcutClass } from "#core/types/shortcut-class.type";
export type { ShortcutConflict } from "#core/types/shortcut-conflict.type";
export type { ShortcutContext } from "#core/types/shortcut-context.type";
export type { ShortcutContextPart } from "#core/types/shortcut-context-part.type";
export type { ShortcutKeyEvent } from "#core/types/shortcut-key-event.type";
export type { ShortcutKeysDisplay } from "#core/types/shortcut-keys-display.type";
export type { ShortcutOptions } from "#core/types/shortcut-options.type";
export type { ShortcutSettingName } from "#core/types/shortcut-setting-name.type";
export type { ShortcutSettings } from "#core/types/shortcut-settings.type";
export type { ShortcutSettingsLayer } from "#core/types/shortcut-settings-layer.type";
