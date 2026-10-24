/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/shortcuts (the `Shortcut` kind, the open `ShortcutContext` and
 *          the way packages contribute to it, the conflict detector and the wiring's `registerShortcuts`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Key parsing, display, platform detection and the registry
 *           state stay internal; the palette list, the hooks and the key hint are `./react`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { Shortcut } from "#core/bases/shortcut.base";
export { ShortcutConflictKind } from "#core/enums/shortcut-conflict-kind.enum";
export { contributeShortcutContext } from "#core/functions/contribute-shortcut-context.function";
export { findShortcutConflicts } from "#core/functions/find-shortcut-conflicts.function";
export { registerShortcuts } from "#core/functions/register-shortcuts.function";
export type { RunnableShortcut } from "#core/types/runnable-shortcut.type";
export type { ShortcutClass } from "#core/types/shortcut-class.type";
export type { ShortcutConflict } from "#core/types/shortcut-conflict.type";
export type { ShortcutContext } from "#core/types/shortcut-context.type";
export type { ShortcutContextPart } from "#core/types/shortcut-context-part.type";
export type { ShortcutOptions } from "#core/types/shortcut-options.type";
