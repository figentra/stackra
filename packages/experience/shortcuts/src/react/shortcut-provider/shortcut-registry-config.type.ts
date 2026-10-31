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
  readonly settings: ShortcutSettings;
  readonly apple: boolean;
  readonly rtl: boolean;
  readonly can: (permission: string) => boolean;
}
