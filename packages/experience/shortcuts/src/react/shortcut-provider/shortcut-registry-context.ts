/**
 * Stackra file contract:
 * Purpose: `ShortcutRegistryContext`, the value of the nearest `ShortcutProvider`. Without a provider the default registry lists nothing and binds nothing, so a component still draws its hint with the platform settings.
 * Boundary: internal to `./react`.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import { createContext } from "react";

import { DEFAULT_SHORTCUT_SETTINGS } from "#core/constants/default-shortcut-settings.constant";
import { createShortcutRegistry } from "#react/shortcut-provider/create-shortcut-registry.function";
import type { ShortcutProviderValue } from "#react/shortcut-provider/shortcut-provider-value.type";

/** The registry used outside any provider; it never registers. */
const DETACHED = createShortcutRegistry(() => ({
  settings: DEFAULT_SHORTCUT_SETTINGS,
  apple: false,
  rtl: false,
  can: () => true,
}));

/** The nearest provider's value. */
export const ShortcutRegistryContext = createContext<ShortcutProviderValue>({
  registry: { ...DETACHED, register: () => () => undefined },
  settings: DEFAULT_SHORTCUT_SETTINGS,
  apple: false,
  rtl: false,
  isMounted: false,
  setSettings: () => undefined,
});
