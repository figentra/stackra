/**
 * Stackra file contract:
 * Purpose: `DEFAULT_SHORTCUT_SETTINGS`, the platform layer of the shortcut settings: on, hints visible, single-key
 *          shortcuts on, nothing remapped, nothing locked.
 * Boundary: data only; a tenant and a person override it at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (platform default).
 */
import { ShortcutHintMode } from "#core/enums/shortcut-hint-mode.enum";
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";

/** The platform default. */
export const DEFAULT_SHORTCUT_SETTINGS: ShortcutSettings = Object.freeze({
  enabled: true,
  hintMode: ShortcutHintMode.Visible,
  singleKey: true,
  remaps: Object.freeze({}),
  locked: Object.freeze([]),
});
