/**
 * Stackra file contract:
 * Purpose: `MenuKind`, where a menu is shown: a page's navigation (header, footer), the native tab bar, a context
 *          menu bound to a value, the desktop menu bar or the tray icon's menu (`Menu({ kind })`).
 * Boundary: codes only; the kind decides which renderer reads the menu, never its items.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0254 (desktop menus); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** The places a menu is shown. */
export const MenuKind = Enum.of({
  /** Links in a page: a site header or footer, a sidebar. */
  Navigation: "navigation",
  /** The native tab bar. */
  TabBar: "tab_bar",
  /** A context menu bound to one value (a long press on a card). */
  Context: "context",
  /** The desktop app's menu bar. */
  App: "app",
  /** The desktop tray icon's menu. */
  Tray: "tray",
});

/** One of the codes above. */
export type MenuKind = Enum.Value<typeof MenuKind>;
