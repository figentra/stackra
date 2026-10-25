/**
 * Stackra file contract:
 * Purpose: `MenuBuilder<V>`, the `m` a menu's `items(m)` receives: one method per kind of entry (`m.route`, `m.group`,
 *          `m.link`, `m.action`, `m.shortcut`, `m.separator`, `m.navigation`, `m.tabs`). `V` is the value a context
 *          menu is bound to (`MenuBuilder<OrderView>`), so params and inputs can be built from it.
 * Boundary: a type only; `createMenuBuilder` is the one implementation, which builds plain entries and resolves
 *           nothing. Each method returns its own kind of entry, so a menu's `items` type says which kinds it holds and
 *           `useMenu` narrows what it returns to them (a menu of routes gives entries that all have `to`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16); registry R-56 (no raw route, icon or permission strings).
 */
import type { ActionRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import type { FlagRef } from "@stackra/feature-flags";
import type { IconName } from "@stackra/icons/contracts";

import type { HrefParams } from "#core/types/href-params.type";
import type { MenuItemKind } from "#core/enums/menu-item-kind.enum";
import type { MenuItem } from "#core/types/menu-item.type";
import type { RouteRef } from "#core/types/route-ref.type";

/** The entry of kind `K` for values of type `V`. */
type Entry<V, K extends MenuItemKind> = Extract<MenuItem<V>, { readonly kind: K }>;

/** Builds the entries of a menu for values of type `V`. */
export interface MenuBuilder<V = unknown> {
  /** A link to a route; its label is the route's title unless given. */
  route(
    to: RouteRef,
    options?: {
      readonly label?: string;
      readonly icon?: IconName;
      readonly params?: HrefParams | ((value: V) => HrefParams);
      readonly end?: boolean;
      readonly flag?: FlagRef;
      readonly shortcut?: string;
    },
  ): Entry<V, typeof MenuItemKind.Route>;

  /** A labelled group of entries. */
  group(label: string, items: readonly MenuItem<V>[]): Entry<V, typeof MenuItemKind.Group>;

  /** An outside URL. */
  link(
    label: string,
    url: string,
    options?: { readonly external?: boolean; readonly icon?: IconName },
  ): Entry<V, typeof MenuItemKind.Link>;

  /** A consumed action, run with the input built from the menu's value. */
  action(
    action: ActionRef,
    options?: {
      readonly label?: string;
      readonly icon?: IconName;
      readonly destructive?: boolean;
      readonly input?: (value: V) => unknown;
      readonly flag?: FlagRef;
    },
  ): Entry<V, typeof MenuItemKind.Action>;

  /** A shortcut class, run as the keyboard runs it. */
  shortcut(shortcut: AnyClass): Entry<V, typeof MenuItemKind.Shortcut>;

  /** A divider. */
  separator(): Entry<V, typeof MenuItemKind.Separator>;

  /** The place of the app's generated navigation tree. */
  navigation(): Entry<V, typeof MenuItemKind.Navigation>;

  /** The place of the routes that declare `tab`, in their order. */
  tabs(): Entry<V, typeof MenuItemKind.Tabs>;
}
