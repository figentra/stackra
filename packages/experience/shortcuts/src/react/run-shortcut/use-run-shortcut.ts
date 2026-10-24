/**
 * Stackra file contract:
 * Purpose: `useRunShortcut()`, the palette's runner: a stable function that runs the shortcut of a `ShortcutItem`
 *          the user picked.
 * Boundary: the same path as `useShortcut`: the instance from the nearest container, the context from the contributed
 *           parts, then `run(ctx)`. Throws outside a `ContainerProvider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23); ADR 0245; ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useCallback } from "react";

import { createShortcutContext } from "#core/functions/create-shortcut-context.function";
import type { ShortcutItem } from "#react/shortcuts/shortcut-item.type";

/**
 * A function that runs the shortcut of an item.
 *
 * @throws Error outside a `ContainerProvider`.
 * @example
 * const runShortcut = useRunShortcut();
 * await runShortcut(shortcut);
 */
export function useRunShortcut(): (shortcut: ShortcutItem) => Promise<void> {
  const container = useContainer();
  return useCallback(
    async (shortcut: ShortcutItem) => {
      await container.get(shortcut.type).run(createShortcutContext());
    },
    [container],
  );
}
