/**
 * Stackra file contract:
 * Purpose: `ShortcutRegistryConfig`, the live configuration the registry reads at key time: settings, platform, direction and the permission check.
 * Boundary: a type only; internal to `./react`.
 * Runtime: isomorphic
 * Governing contract: ADR 0508.
 */
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";

/** What the registry reads at each call. */
export interface ShortcutRegistryConfig {
  /** The shortcut settings in force. */
  readonly settings: ShortcutSettings;
  /** True on a Mac, iPhone or iPad, where Mod is Command. */
  readonly apple: boolean;
  /** True on a right-to-left page, where directional bindings mirror. */
  readonly rtl: boolean;
  /** Whether the person holds a permission; a refused action is not registered. */
  readonly can: (permission: string) => boolean;
}
