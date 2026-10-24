/**
 * Stackra file contract:
 * Purpose: `useShortcuts()`, the palette's list: every registered shortcut the container of the nearest
 *          `ContainerProvider` binds, in registration order, as `ShortcutItem`s.
 * Boundary: reads `SHORTCUT_ENTRIES`, which the generated wiring fills before the first render; a class the container
 *           does not bind (left out of this app) is not listed. Throws outside a `ContainerProvider`. Groups and
 *           filters nothing: the palette groups by `group`, its dialog filters by text.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23); ADR 0245; ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useMemo } from "react";

import { SHORTCUT_ENTRIES } from "#core/constants/shortcut-entries.constant";
import type { ShortcutItem } from "#react/shortcuts/shortcut-item.type";

/**
 * The palette's entries.
 *
 * @throws Error outside a `ContainerProvider`.
 * @example
 * const shortcuts = useShortcuts();
 * shortcuts.map((shortcut) => <Command.Item key={shortcut.key}>{t(shortcut.label)}</Command.Item>);
 */
export function useShortcuts(): readonly ShortcutItem[] {
  const container = useContainer();
  return useMemo(
    () =>
      [...SHORTCUT_ENTRIES.values()]
        .filter((entry) => container.has(entry.type))
        .map((entry) => ({
          type: entry.type,
          key: entry.key,
          label: entry.label,
          group: entry.group,
          ...(entry.keys === null ? {} : { keys: entry.keys }),
          ...(entry.icon === null ? {} : { icon: entry.icon }),
          ...(entry.intents.length === 0 ? {} : { intents: entry.intents }),
        })),
    [container],
  );
}
