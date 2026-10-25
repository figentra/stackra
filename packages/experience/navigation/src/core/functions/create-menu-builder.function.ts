/**
 * Stackra file contract:
 * Purpose: `createMenuBuilder()`, the `m` a menu's `items(m)` receives: each method returns a plain entry and resolves
 *          nothing, so one menu class describes its entries once for every renderer.
 * Boundary: internal; `resolveMenuItems` reads what it built. Optional fields are left out rather than set to
 *           `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16).
 */
import { MenuItemKind } from "#core/enums/menu-item-kind.enum";
import type { MenuBuilder } from "#core/types/menu-builder.type";

/** `source` without its `undefined` fields. */
const defined = <T extends object>(source: T): T =>
  Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined)) as T;

/**
 * A builder of entries for values of type `V`.
 *
 * @example
 * const items = new SiteMenu(site).items(createMenuBuilder());
 */
export function createMenuBuilder<V = unknown>(): MenuBuilder<V> {
  return Object.freeze({
    route: (to, options = {}) =>
      defined({ kind: MenuItemKind.Route, to, ...options }) as ReturnType<MenuBuilder<V>["route"]>,
    group: (label, items) => ({ kind: MenuItemKind.Group, label, items }),
    link: (label, url, options = {}) =>
      defined({
        kind: MenuItemKind.Link,
        label,
        url,
        external: options.external ?? false,
        icon: options.icon,
      }) as ReturnType<MenuBuilder<V>["link"]>,
    action: (action, options = {}) =>
      defined({ kind: MenuItemKind.Action, action, ...options }) as ReturnType<
        MenuBuilder<V>["action"]
      >,
    shortcut: (shortcut) => ({ kind: MenuItemKind.Shortcut, shortcut }),
    separator: () => ({ kind: MenuItemKind.Separator }),
    navigation: () => ({ kind: MenuItemKind.Navigation }),
    tabs: () => ({ kind: MenuItemKind.Tabs }),
  } satisfies MenuBuilder<V>);
}
