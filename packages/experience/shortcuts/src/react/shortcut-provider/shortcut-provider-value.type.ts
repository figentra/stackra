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
  /** The registry the provider's hooks register with. */
  readonly registry: ShortcutRegistry;
  /** The shortcut settings in force. */
  readonly settings: ShortcutSettings;
  /** True on a Mac, iPhone or iPad, where Mod is Command. */
  readonly apple: boolean;
  /** True on a right-to-left page, where directional bindings mirror. */
  readonly rtl: boolean;
  /** False for the detached default outside any provider. */
  readonly isMounted: boolean;
  /** Changes the settings and reports them to the host. */
  readonly setSettings: (settings: ShortcutSettings) => void;
}
