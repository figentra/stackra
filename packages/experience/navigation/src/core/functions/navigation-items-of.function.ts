/**
 * Stackra file contract:
 * Purpose: `navigationItemsOf(items, { label, isCurrent }, parent?)`, a resolved menu as `@stackra/ui`'s
 *          `NavigationItem`s, the shape the Sidebar and the NavigationList draw: routes and links become entries with an
 *          `href`, groups become headings over their entries, each label translated, a route marked current when the
 *          caller says so.
 * Boundary: internal to the web and native `ModuleMenu`; pure. Actions, shortcuts, separators and the navigation and
 *           tabs places have no meaning in a list of places and are left out, and a group left empty goes with them.
 *           Ids are the position under `parent` (`loyalty_kit_main.2.0`), stable while the menu is.
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decisions 1 and 3); ADR 0317 (decisions 1 and 3: the caller sets `isCurrent`).
 */
import type { NavigationItem } from "@stackra/ui/contracts";

import { MenuItemKind } from "#core/enums/menu-item-kind.enum";
import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";

/**
 * The places of `items`.
 *
 * @param resolve.label - translates an entry's label key.
 * @param resolve.isCurrent - whether a route entry's href is the current place; none is current when left out.
 * @param parent - the id prefix, a menu key at the top level.
 * @example
 * navigationItemsOf(resolve(MainMenu), { label: (key) => t(key as I18nKey) }, "loyalty_kit_main");
 */
export function navigationItemsOf(
  items: readonly ResolvedMenuItem[],
  resolve: {
    readonly label: (key: string) => string;
    readonly isCurrent?: ((href: string, end: boolean) => boolean) | undefined;
  },
  parent = "menu",
): NavigationItem[] {
  return items.flatMap((item, index): NavigationItem[] => {
    const id = `${parent}.${String(index)}`;
    switch (item.kind) {
      case MenuItemKind.Route: {
        return [
          {
            id,
            label: resolve.label(item.label),
            href: item.to,
            icon: item.icon,
            isCurrent: resolve.isCurrent?.(item.to, item.end) ?? false,
          },
        ];
      }
      case MenuItemKind.Link: {
        return [{ id, label: resolve.label(item.label), href: item.href, icon: item.icon }];
      }
      case MenuItemKind.Group: {
        const children = navigationItemsOf(item.items, resolve, id);
        return children.length === 0 ? [] : [{ id, label: resolve.label(item.label), children }];
      }
      default: {
        return [];
      }
    }
  });
}
