/**
 * Stackra file contract:
 * Purpose: `useMenuResolver()`, a function that turns a menu class (and a value) into its entries ready to draw on the
 *          web: built through the container, route hrefs in the visitor's locale mount, entries behind a flag that is
 *          off left out. `useMenu` reads one menu through it; `ModuleMenu` reads every declared menu.
 * Boundary: internal; a new function when the container, the mount or the flag values change.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0297 (decision 4); ADR 0111 (decision 3).
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { useCallback } from "react";

import { createMenuBuilder } from "#core/functions/create-menu-builder.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { resolveMenuItems } from "#core/functions/resolve-menu-items.function";
import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useFlagCheck } from "#react/flags/use-flag-check";
import { useHrefResolver } from "#react/href/use-href-resolver";

/**
 * The web menu resolver.
 *
 * @example
 * const resolve = useMenuResolver();
 * resolve(SiteMenu);
 */
export function useMenuResolver(): <V>(
  type: AnyClass<RunnableMenu<V>>,
  value?: V,
) => readonly ResolvedMenuItem[] {
  const container = useContainer();
  const href = useHrefResolver();
  const isOn = useFlagCheck();
  return useCallback(
    <V>(type: AnyClass<RunnableMenu<V>>, value?: V) =>
      resolveMenuItems(instanceOf(type, container).items(createMenuBuilder<V>()), {
        value,
        href,
        isOn,
      }),
    [container, href, isOn],
  );
}
