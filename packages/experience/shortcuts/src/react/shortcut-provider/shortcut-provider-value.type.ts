/**
 * Stackra file contract:
 * Purpose: `ShortcutProviderValue`, what `ShortcutProvider` shares with its hooks: the registry, the settings and their setter, the platform and the direction.
 * Boundary: a type only; internal to `./react`.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";
import type { ShortcutRegistry } from "#react/shortcut-provider/shortcut-registry.type";

/** What the provider shares. */
export interface ShortcutProviderValue {
  readonly registry: ShortcutRegistry;
  readonly settings: ShortcutSettings;
  readonly apple: boolean;
  readonly rtl: boolean;
  /** False for the detached default outside any provider. */
  readonly isMounted: boolean;
  readonly setSettings: (settings: ShortcutSettings) => void;
}
