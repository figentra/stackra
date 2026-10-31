/**
 * Stackra file contract:
 * Purpose: `ShortcutRegistryState`, what `useShortcutRegistry` returns: the registered actions, the settings and their
 *          setter, a runner by id, and the conflict check a key recorder uses.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (cheat sheet, palette, settings panel).
 */
import type { ShortcutConflict } from "#core/types/shortcut-conflict.type";
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";
import type { RegisteredShortcut } from "#react/shortcut-provider/registered-shortcut.type";

/** The registry as a component sees it. */
export interface ShortcutRegistryState {
  readonly actions: readonly RegisteredShortcut[];
  readonly settings: ShortcutSettings;
  readonly setSettings: (settings: ShortcutSettings) => void;
  /** Runs the registered action `id`; false when none answers. */
  readonly run: (id: string) => boolean;
  /** The conflicts `keys` would have as action `id`'s binding: other actions, standard bindings, reserved keys. */
  readonly conflictsOf: (id: string, keys: string) => readonly ShortcutConflict[];
  /** True on a Mac, iPhone or iPad. */
  readonly apple: boolean;
}
