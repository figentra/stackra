/**
 * Stackra file contract:
 * Purpose: `ShortcutSettingsLayer`, one layer of shortcut settings (platform default, tenant from the dashboard, the
 *          person): any field it sets, and the fields it locks for the layers after it.
 * Boundary: a type only; `resolveShortcutSettings` folds the layers.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (three settings layers); ADR 0496.
 */
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";

/** One settings layer. */
export type ShortcutSettingsLayer = Partial<ShortcutSettings>;
