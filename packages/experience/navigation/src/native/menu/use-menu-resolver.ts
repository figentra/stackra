/**
 * Stackra file contract:
 * Purpose: `useMenuResolver()` on native, a function that turns a menu class (and a value) into its entries ready to
 *          draw: built through the container, route hrefs as the app paths React Navigation's linking config opens,
 *          entries behind a flag that is off left out. The native `useMenu` reads one menu through it; `ModuleMenu`
 *          reads every declared menu.
 * Boundary: internal; a new function when the container or the flag values change. A phone has no locale mount, so a
 *           route's href is its path unprefixed. The shared body is `useMenuResolverWith`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 14, 15 and 16); ADR 0317 (decision 2: app paths through `RouterProvider`).
 */
import { resolveHref } from "#core/functions/resolve-href.function";
import type { MenuResolver } from "#core/types/menu-resolver.type";
import { useMenuResolverWith } from "#react/menu/use-menu-resolver-with";

/**
 * The native menu resolver.
 *
 * @example
 * const resolve = useMenuResolver();
 * resolve(MainMenu);
 */
export function useMenuResolver(): MenuResolver {
  return useMenuResolverWith(resolveHref);
}
