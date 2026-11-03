/**
 * Stackra file contract:
 * Purpose: `useMenu(MenuClass, value?)` on native, at parity with the web hook: a menu's entries ready to draw in a
 *          native component, route entries with their app paths (what `RouterProvider` and React Navigation's linking
 *          config open), entries behind a flag that is off left out.
 * Boundary: builds the menu through the container (its constructor dependencies) or plainly; runs no action. The
 *           result is narrowed to the kinds the menu's `items` returns; a renderer of mixed kinds switches on
 *           `item.kind`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 14, 15 and 16); ADR 0111 (decisions 1 and 3).
 */
import type { AnyClass } from "@stackra/container";
import { useMemo } from "react";

import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useMenuResolver } from "#native/menu/use-menu-resolver";

/**
 * The drawable entries of `type`.
 *
 * @example
 * items = useMenu(MainMenu);
 */
export function useMenu<M extends RunnableMenu<V>, V = unknown>(
  type: AnyClass<M>,
  value?: V,
): readonly Extract<ResolvedMenuItem, { readonly kind: ReturnType<M["items"]>[number]["kind"] }>[] {
  const resolve = useMenuResolver();
  return useMemo(
    () =>
      resolve<V>(type, value) as readonly Extract<
        ResolvedMenuItem,
        { readonly kind: ReturnType<M["items"]>[number]["kind"] }
      >[],
    [resolve, type, value],
  );
}
