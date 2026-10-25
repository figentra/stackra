/**
 * Stackra file contract:
 * Purpose: `MenuItem<V>`, one entry a menu's `items(m)` returns, as the `MenuBuilder` made it: still unresolved (a route
 *          ref, params and inputs that may be functions of the menu's value, a flag not yet read).
 * Boundary: a type only; `resolveMenuItems` turns a list of them into `ResolvedMenuItem`s for one value, locale and
 *           flag state. Authors build entries with `m.*`, never by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16); registry R-56 (no raw route strings).
 */
import type { ActionRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import type { FlagRef } from "@stackra/feature-flags";
import type { IconName } from "@stackra/icons/contracts";

import type { MenuItemKind } from "#core/enums/menu-item-kind.enum";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteRef } from "#core/types/route-ref.type";

/** One unresolved menu entry for values of type `V`. */
export type MenuItem<V = unknown> =
  | {
      readonly kind: typeof MenuItemKind.Route;
      /** The route. */
      readonly to: RouteRef;
      /** The label key; the route's title when left out. */
      readonly label?: string;
      readonly icon?: IconName;
      /** The route's params, or how to build them from the menu's value. */
      readonly params?: HrefParams | ((value: V) => HrefParams);
      /** Active only on the exact path (a home link). */
      readonly end?: boolean;
      readonly flag?: FlagRef;
      /** A key hint shown beside the entry in a desktop menu (`mod+shift+o`). */
      readonly shortcut?: string;
    }
  | {
      readonly kind: typeof MenuItemKind.Link;
      readonly label: string;
      /** The outside URL. */
      readonly url: string;
      /** Opens in a new tab or the system browser. */
      readonly external: boolean;
      readonly icon?: IconName;
    }
  | {
      readonly kind: typeof MenuItemKind.Group;
      readonly label: string;
      readonly items: readonly MenuItem<V>[];
    }
  | {
      readonly kind: typeof MenuItemKind.Action;
      /** The consumed action. */
      readonly action: ActionRef;
      readonly label?: string;
      readonly icon?: IconName;
      /** Drawn in the danger tone. */
      readonly destructive?: boolean;
      /** Builds the action's input from the menu's value. */
      readonly input?: (value: V) => unknown;
      readonly flag?: FlagRef;
    }
  | {
      readonly kind: typeof MenuItemKind.Shortcut;
      /** The shortcut class. */
      readonly shortcut: AnyClass;
    }
  | { readonly kind: typeof MenuItemKind.Separator }
  | { readonly kind: typeof MenuItemKind.Navigation }
  | { readonly kind: typeof MenuItemKind.Tabs };
