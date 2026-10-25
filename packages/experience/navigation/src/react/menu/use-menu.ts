/**
 * Stackra file contract:
 * Purpose: `useMenu(MenuClass, value?)`, a menu's entries ready to draw in a web or desktop component: route entries
 *          with their hrefs in the visitor's locale mount, entries behind a flag that is off left out.
 * Boundary: builds the menu through the container (its constructor dependencies) or plainly; runs no action. The
 *           result is narrowed to the kinds the menu's `items` returns (a menu of routes gives entries with `to`); a
 *           renderer of mixed kinds switches on `item.kind`.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0297 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { useMemo } from "react";

import { createMenuBuilder } from "#core/functions/create-menu-builder.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { resolveMenuItems } from "#core/functions/resolve-menu-items.function";
import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useFlagCheck } from "#react/flags/use-flag-check";
import { useHrefResolver } from "#react/href/use-href-resolver";

/**
 * The drawable entries of `type`.
 *
 * @example
 * items = useMenu(SiteMenu);
 */
export function useMenu<M extends RunnableMenu<V>, V = unknown>(
  type: AnyClass<M>,
  value?: V,
): readonly Extract<ResolvedMenuItem, { readonly kind: ReturnType<M["items"]>[number]["kind"] }>[] {
  const container = useContainer();
  const href = useHrefResolver();
  const isOn = useFlagCheck();
  const menu = useMemo(() => instanceOf(type, container), [type, container]);
  return useMemo(
    () =>
      resolveMenuItems(menu.items(createMenuBuilder<V>()), {
        value,
        href,
        isOn,
      }) as readonly Extract<
        ResolvedMenuItem,
        { readonly kind: ReturnType<M["items"]>[number]["kind"] }
      >[],
    [menu, value, href, isOn],
  );
}
