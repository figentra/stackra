/**
 * Stackra file contract:
 * Purpose: `useShortcut(Class)`, a stable handler that runs one shortcut: a button, a menu item or a toggle runs the
 *          same class the key and the palette run, so the behaviour has one owner.
 * Boundary: resolves the instance from the container of the nearest `ContainerProvider` when the handler is called,
 *           builds the context from the contributed parts, then awaits `run(ctx)`. The handler ignores its arguments,
 *           so it can be passed as `onPress` or `onAction` directly. Throws outside a provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23); ADR 0295 (decision 10).
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { useCallback } from "react";

import { createShortcutContext } from "#core/functions/create-shortcut-context.function";
import type { RunnableShortcut } from "#core/index";

/**
 * A handler that runs `type`.
 *
 * @throws Error outside a `ContainerProvider`; the handler rejects when the container does not bind `type`.
 * @example
 * openPalette = useShortcut(OpenPaletteShortcut);
 * <Button onPress={this.openPalette}>...</Button>
 */
export function useShortcut(type: AnyClass<RunnableShortcut>): () => Promise<void> {
  const container = useContainer();
  return useCallback(async () => {
    await container.get(type).run(createShortcutContext());
  }, [container, type]);
}
