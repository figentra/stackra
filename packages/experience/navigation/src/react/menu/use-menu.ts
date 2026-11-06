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

import type { MenuEntries } from "#core/types/menu-entries.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useMenuFrom } from "#react/menu/use-menu-from";
import { useMenuResolver } from "#react/menu/use-menu-resolver";

/**
 * The drawable entries of `type`.
 *
 * @example
 * items = useMenu(SiteMenu);
 */
export function useMenu<M extends RunnableMenu<V>, V = unknown>(
  type: AnyClass<M>,
  value?: V,
): MenuEntries<M, V> {
  return useMenuFrom<M, V>(useMenuResolver(), type, value);
}
