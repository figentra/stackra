/**
 * Stackra file contract:
 * Purpose: `useMenuResolverWith(href)`, the menu resolver both entries share: built through the container, route hrefs
 *          through `href`, entries behind a flag that is off left out. The web `useMenuResolver` passes the locale
 *          mount's href resolver; the native one passes app paths.
 * Boundary: internal; platform-free (no router, no DOM), so the native entry imports it. A new function when the
 *           container, `href` or the flag values change.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 15 and 16); ADR 0111 (decision 3).
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { useCallback } from "react";

import { createMenuBuilder } from "#core/functions/create-menu-builder.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { resolveMenuItems } from "#core/functions/resolve-menu-items.function";
import type { HrefParams } from "#core/types/href-params.type";
import type { MenuResolver } from "#core/types/menu-resolver.type";
import type { RouteRef } from "#core/types/route-ref.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useFlagCheck } from "#react/flags/use-flag-check";

/**
 * A menu resolver whose route entries resolve through `href`.
 *
 * @param href - resolves a route ref with its params to the href to draw; keep it stable.
 * @example
 * const resolve = useMenuResolverWith(useHrefResolver());
 * resolve(SiteMenu);
 */
export function useMenuResolverWith(
  href: (to: RouteRef, params?: HrefParams) => string,
): MenuResolver {
  const container = useContainer();
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
