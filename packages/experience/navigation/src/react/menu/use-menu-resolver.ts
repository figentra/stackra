/**
 * Stackra file contract:
 * Purpose: `useMenuResolver()`, a function that turns a menu class (and a value) into its entries ready to draw on the
 *          web: built through the container, route hrefs in the visitor's locale mount, entries behind a flag that is
 *          off left out. `useMenu` reads one menu through it; `ModuleMenu` reads every declared menu.
 * Boundary: internal; a new function when the container, the mount or the flag values change.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0297 (decision 4); ADR 0111 (decision 3).
 */
import type { MenuResolver } from "#core/types/menu-resolver.type";
import { useHrefResolver } from "#react/href/use-href-resolver";
import { useMenuResolverWith } from "#react/menu/use-menu-resolver-with";

/**
 * The web menu resolver.
 *
 * @example
 * const resolve = useMenuResolver();
 * resolve(SiteMenu);
 */
export function useMenuResolver(): MenuResolver {
  return useMenuResolverWith(useHrefResolver());
}
