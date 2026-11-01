/**
 * Stackra file contract:
 * Purpose: `useShortcutRegistry()`, the registry of the nearest `ShortcutProvider` for the cheat sheet, the palette and
 *          the settings panel: the registered actions (live), the settings, a runner and the conflict check.
 * Boundary: the conflict check is `findShortcutConflicts` with reserved keys, over the other registered actions and the
 *           standard bindings (`STANDARD_SHORTCUTS`); it throws nothing for a binding that does not parse, it returns
 *           no conflict and the recorder refuses it.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import { use, useCallback, useSyncExternalStore } from "react";

import { STANDARD_SHORTCUTS } from "#core/constants/standard-shortcuts.constant";
import { findShortcutConflicts } from "#core/functions/find-shortcut-conflicts.function";
import type { ShortcutConflict } from "#core/types/shortcut-conflict.type";
import { ShortcutRegistryContext } from "#react/shortcut-provider/shortcut-registry-context";
import type { ShortcutRegistryState } from "#react/shortcut-registry/shortcut-registry-state.type";

/**
 * Reads the shortcut registry: the registered actions, the settings, a runner and the conflict check.
 *
 * @example
 * const { actions } = useShortcutRegistry();
 */
export function useShortcutRegistry(): ShortcutRegistryState {
  const { registry, settings, setSettings, apple } = use(ShortcutRegistryContext);
  const actions = useSyncExternalStore(registry.subscribe, registry.list, registry.list);
  const conflictsOf = useCallback(
    (id: string, keys: string): readonly ShortcutConflict[] => {
      const others = new Map<string, string>();
      for (const [standard, binding] of Object.entries(STANDARD_SHORTCUTS))
        if (standard !== id) others.set(standard, settings.remaps[standard] ?? binding);
      for (const action of actions)
        if (action.id !== id && action.keys !== undefined) others.set(action.id, action.keys);
      try {
        return findShortcutConflicts(
          [{ key: id, keys }, ...[...others].map(([key, binding]) => ({ key, keys: binding }))],
          { reserved: true },
        ).filter((conflict) => conflict.shortcuts.includes(id));
      } catch {
        return [];
      }
    },
    [actions, settings.remaps],
  );
  return { actions, settings, setSettings, run: registry.run, conflictsOf, apple };
}
