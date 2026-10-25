/**
 * Stackra file contract:
 * Purpose: `ResolvedMenuItem`, one menu entry ready to draw: route entries carry their localised href (`to`), groups
 *          their resolved children, actions their built input; entries behind a flag that is off are already gone.
 * Boundary: a type only, discriminated by `kind` (`MenuItemKind`); every entry has a `label` (an i18n key, empty for a
 *           separator, the navigation and tabs places and a shortcut, whose label is the shortcut's own).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0297 (decision 4: hrefs stay in the visitor's mount).
 */
import type { ActionRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import type { IconName } from "@stackra/icons/contracts";

import type { MenuItemKind } from "#core/enums/menu-item-kind.enum";

/** One drawable menu entry. */
export type ResolvedMenuItem =
  | {
      readonly kind: typeof MenuItemKind.Route;
      readonly label: string;
      /** The localised href. */
      readonly to: string;
      /** Active only on the exact path. */
      readonly end: boolean;
      readonly icon?: IconName;
      readonly shortcut?: string;
    }
  | {
      readonly kind: typeof MenuItemKind.Link;
      readonly label: string;
      readonly href: string;
      readonly external: boolean;
      readonly icon?: IconName;
    }
  | {
      readonly kind: typeof MenuItemKind.Group;
      readonly label: string;
      readonly items: readonly ResolvedMenuItem[];
    }
  | {
      readonly kind: typeof MenuItemKind.Action;
      /** The given label key, else the action's key. */
      readonly label: string;
      readonly action: ActionRef;
      /** The input built from the menu's value; `undefined` when the entry builds none. */
      readonly input: unknown;
      readonly destructive: boolean;
      readonly icon?: IconName;
    }
  | {
      readonly kind: typeof MenuItemKind.Shortcut;
      readonly label: string;
      readonly shortcut: AnyClass;
    }
  | { readonly kind: typeof MenuItemKind.Separator; readonly label: string }
  | { readonly kind: typeof MenuItemKind.Navigation; readonly label: string }
  | { readonly kind: typeof MenuItemKind.Tabs; readonly label: string };
