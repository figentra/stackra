/**
 * Stackra file contract:
 * Purpose: `useMenuResolver()` on native, a function that turns a menu class (and a value) into its entries ready to
 *          draw: built through the container, route hrefs as the app paths React Navigation's linking config opens,
 *          entries behind a flag that is off left out. The native `useMenu` reads one menu through it; `ModuleMenu`
 *          reads every declared menu.
 * Boundary: internal; a new function when the container or the flag values change. A phone has no locale mount, so a
 *           route's href is its path unprefixed. The web entry has its own copy, because entries import `.` only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 14, 15 and 16); ADR 0317 (decision 2: app paths through `RouterProvider`).
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { useCallback } from "react";

import { createMenuBuilder } from "#core/functions/create-menu-builder.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import { resolveMenuItems } from "#core/functions/resolve-menu-items.function";
import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useFlagCheck } from "#native/flags/use-flag-check";

/**
 * The native menu resolver.
 *
 * @example
 * const resolve = useMenuResolver();
 * resolve(MainMenu);
 */
export function useMenuResolver(): <V>(
  type: AnyClass<RunnableMenu<V>>,
  value?: V,
) => readonly ResolvedMenuItem[] {
  const container = useContainer();
  const isOn = useFlagCheck();
  return useCallback(
    <V>(type: AnyClass<RunnableMenu<V>>, value?: V) =>
      resolveMenuItems(instanceOf(type, container).items(createMenuBuilder<V>()), {
        value,
        href: (to, params) => resolveHref(to, params),
        isOn,
      }),
    [container, isOn],
  );
}
