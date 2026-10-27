/**
 * Stackra file contract:
 * Purpose: the web `Navbar` compound on HeroUI Pro's Navbar: the root takes the shared `size` and names its landmark
 *          from `label`, `Navbar.MenuToggle` names its button from `label` (HeroUI Pro's `srLabel`), and every other
 *          part (Header, Brand, Content, Item, Label, Menu, MenuItem, Separator, Spacer) is HeroUI Pro's own; the
 *          `useNavbar` hook comes with it.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `Navbar.Root` is left out. Imports the `navbar` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import { Navbar as HeroNavbar } from "@heroui-pro/react/navbar";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#react/hooks/use-ui-pro-text";
import type { NavbarProps } from "#react/navbar/navbar.props";
import type { NavbarMenuToggleProps } from "#react/navbar/navbar-menu-toggle.props";

/** The navigation landmark: HeroUI Pro's `Navbar.Root`, named by `label`. */
function NavbarRoot({ label, size, ...rest }: NavbarProps) {
  return <HeroNavbar.Root {...rest} {...omitUndefined({ size, "aria-label": label })} />;
}

/** The button that opens and closes the menu on a narrow viewport, named by `label`. */
function NavbarMenuToggle({ label, ...rest }: NavbarMenuToggleProps) {
  const t = useUiProText();
  return (
    <HeroNavbar.MenuToggle {...rest} srLabel={label ?? t(UI_PRO_KEYS.ui_pro.navbar.open_menu)} />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface NavbarParts {
  /** The inner row that holds the bar's content, sized by `maxWidth`. */
  readonly Header: typeof HeroNavbar.Header;
  /** The logo and name. */
  readonly Brand: typeof HeroNavbar.Brand;
  /** A group of items inside the header. */
  readonly Content: typeof HeroNavbar.Content;
  /** One link of the bar; `isCurrent` marks the current page. */
  readonly Item: typeof HeroNavbar.Item;
  /** Text inside an item. */
  readonly Label: typeof HeroNavbar.Label;
  /** The panel shown on a narrow viewport. */
  readonly Menu: typeof HeroNavbar.Menu;
  /** One link of the panel; `isCurrent` marks the current page. */
  readonly MenuItem: typeof HeroNavbar.MenuItem;
  /** The button that opens the panel, named by `label`. */
  readonly MenuToggle: typeof NavbarMenuToggle;
  /** A divider between items. */
  readonly Separator: typeof HeroNavbar.Separator;
  /** Flexible space that pushes the following items to the end. */
  readonly Spacer: typeof HeroNavbar.Spacer;
}

/**
 * A top navigation bar: `Navbar.Header` holds `Navbar.Brand` and `Navbar.Content` of `Navbar.Item`, and `Navbar.Menu`
 * is the panel `Navbar.MenuToggle` opens on a narrow viewport. Name the landmark for screen readers with `label`.
 */
export const Navbar: typeof NavbarRoot & NavbarParts = Object.assign(NavbarRoot, {
  Header: HeroNavbar.Header,
  Brand: HeroNavbar.Brand,
  Content: HeroNavbar.Content,
  Item: HeroNavbar.Item,
  Label: HeroNavbar.Label,
  Menu: HeroNavbar.Menu,
  MenuItem: HeroNavbar.MenuItem,
  MenuToggle: NavbarMenuToggle,
  Separator: HeroNavbar.Separator,
  Spacer: HeroNavbar.Spacer,
});

export { useNavbar } from "@heroui-pro/react/navbar";
