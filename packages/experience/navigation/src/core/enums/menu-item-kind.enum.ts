/**
 * Stackra file contract:
 * Purpose: `MenuItemKind`, what one entry of a menu is: a route link, an outside link, a group, an action, a
 *          shortcut, a separator, or the place of the generated navigation or of the tab routes.
 * Boundary: codes only; `ResolvedMenuItem` is discriminated by them, so a renderer switches on `item.kind`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16: `menus/`); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** The kinds of menu entry. */
export const MenuItemKind = Enum.of({
  /** A route of the app, by its `Routes.<key>` ref. */
  Route: "route",
  /** An outside URL. */
  Link: "link",
  /** A labelled group of entries (a sub-navigation, a menu-bar menu). */
  Group: "group",
  /** A consumed action, run with an input built from the menu's value. */
  Action: "action",
  /** A shortcut class, run as the keyboard would run it. */
  Shortcut: "shortcut",
  /** A divider. */
  Separator: "separator",
  /** The generated navigation tree of the app's panel. */
  Navigation: "navigation",
  /** The routes that declare `tab`, in their order. */
  Tabs: "tabs",
});

/** One of the codes above. */
export type MenuItemKind = Enum.Value<typeof MenuItemKind>;
