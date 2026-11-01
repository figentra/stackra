/**
 * Stackra file contract:
 * Purpose: `ShortcutProviderProps`, what `ShortcutProvider` takes: the resolved settings (controlled) or the initial
 *          ones, the change callback that persists the person's layer, the page direction and the permission check.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0508; ADR 0496 (person preferences persist the settings).
 */
import type { ReactNode } from "react";

import type { ShortcutSettings } from "#core/types/shortcut-settings.type";

/** The props of the shortcut provider. */
export interface ShortcutProviderProps {
  /** The app the provider listens for shortcuts in. */
  readonly children?: ReactNode;
  /** The settings in force (`resolveShortcutSettings`); controlled when given. */
  readonly settings?: ShortcutSettings | undefined;
  /** The starting settings when `settings` is not given. Defaults to the platform default. */
  readonly defaultSettings?: ShortcutSettings | undefined;
  /** Called when the person changes a setting (the settings panel); persist it here. */
  readonly onSettingsChange?: ((settings: ShortcutSettings) => void) | undefined;
  /** `rtl` mirrors directional bindings. Defaults to `ltr`. */
  readonly direction?: "ltr" | "rtl" | undefined;
  /** Whether the person holds a permission; an action whose `permission` is refused is not registered. */
  readonly can?: ((permission: string) => boolean) | undefined;
}
