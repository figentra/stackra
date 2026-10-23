/**
 * Stackra file contract:
 * Purpose: the web `Sidebar` compound on HeroUI Pro's Sidebar: the root, `label` for its accessible name, and every
 *          part a consumer builds the documented examples from (Provider, Header, Content, Footer, Group, Menu,
 *          MenuItem, Submenu, Pages, Mobile, Rail, Trigger and the rest), with the `useSidebar` and `useSidebarPages`
 *          hooks.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`, and the root needs a
 *          `Sidebar.Provider` (or an `AppLayout`) above it. Imports the `sidebar` subpath.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-005.
 */
import {
  Sidebar as HeroSidebar,
  type SidebarRootProps as HeroSidebarRootProps,
} from "@heroui-pro/react/sidebar";

import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";
import { SidebarMenu } from "#react/sidebar/sidebar-menu";
import { SidebarRail } from "#react/sidebar/sidebar-rail";
import { SidebarTrigger } from "#react/sidebar/sidebar-trigger";

/** Props of the web Sidebar: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarProps = SidebarContractProps &
  Omit<HeroSidebarRootProps, keyof SidebarContractProps | "aria-label">;

/** The sidebar landmark: HeroUI Pro's `Sidebar.Root`, named by `label`. */
function SidebarRoot({ label, ...rest }: SidebarProps) {
  return <HeroSidebar.Root {...rest} {...(label ? { "aria-label": label } : {})} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface SidebarParts {
  /** Holds the open state, the collapse mode, the side, the variant and the toggle shortcut. */
  readonly Provider: typeof HeroSidebar.Provider;
  /** The top section, usually a logo. */
  readonly Header: typeof HeroSidebar.Header;
  /** The scrollable middle section. */
  readonly Content: typeof HeroSidebar.Content;
  /** The bottom section. */
  readonly Footer: typeof HeroSidebar.Footer;
  /** A group of menus under a `GroupLabel`. */
  readonly Group: typeof HeroSidebar.Group;
  /** The heading of a group. */
  readonly GroupLabel: typeof HeroSidebar.GroupLabel;
  /** The navigation tree, named by `label`. */
  readonly Menu: typeof SidebarMenu;
  /** A headed section inside a menu. */
  readonly MenuSection: typeof HeroSidebar.MenuSection;
  /** The heading of a menu section. */
  readonly MenuHeader: typeof HeroSidebar.MenuHeader;
  /** One menu entry; a link when it has an `href`. */
  readonly MenuItem: typeof HeroSidebar.MenuItem;
  /** Wraps an item's content so it can hold a submenu. */
  readonly MenuItemContent: typeof HeroSidebar.MenuItemContent;
  /** The icon of an item. */
  readonly MenuIcon: typeof HeroSidebar.MenuIcon;
  /** The label of an item. */
  readonly MenuLabel: typeof HeroSidebar.MenuLabel;
  /** A badge at the end of an item. */
  readonly MenuChip: typeof HeroSidebar.MenuChip;
  /** A row of actions shown on an item. */
  readonly MenuActions: typeof HeroSidebar.MenuActions;
  /** One action button inside `MenuActions`. */
  readonly MenuAction: typeof HeroSidebar.MenuAction;
  /** The button that expands an item's submenu. */
  readonly MenuTrigger: typeof HeroSidebar.MenuTrigger;
  /** The chevron that shows an item's submenu state. */
  readonly MenuIndicator: typeof HeroSidebar.MenuIndicator;
  /** The nested items of an item. */
  readonly Submenu: typeof HeroSidebar.Submenu;
  /** A tooltip shown while the sidebar is collapsed to icons. */
  readonly Tooltip: typeof HeroSidebar.Tooltip;
  /** A divider between sections. */
  readonly Separator: typeof HeroSidebar.Separator;
  /** The sheet that replaces the sidebar on a narrow viewport. */
  readonly Mobile: typeof HeroSidebar.Mobile;
  /** A switcher between sibling pages inside the sidebar. */
  readonly Pages: typeof HeroSidebar.Pages;
  /** One page of `Pages`, identified by its `value`. */
  readonly Page: typeof HeroSidebar.Page;
  /** The edge strip that toggles the sidebar, named by `label`. */
  readonly Rail: typeof SidebarRail;
  /** The icon-only button that toggles the sidebar, named by `label`. */
  readonly Trigger: typeof SidebarTrigger;
  /** The main content column beside the sidebar. */
  readonly Main: typeof HeroSidebar.Main;
}

/**
 * A collapsible navigation sidebar: `Sidebar.Provider` holds the state, `Sidebar` is the landmark with `Header`,
 * `Content` (holding `Group` and `Menu` of `MenuItem`) and `Footer`, and `Sidebar.Mobile` is its narrow-viewport sheet.
 */
export const Sidebar: typeof SidebarRoot & SidebarParts = Object.assign(SidebarRoot, {
  Provider: HeroSidebar.Provider,
  Header: HeroSidebar.Header,
  Content: HeroSidebar.Content,
  Footer: HeroSidebar.Footer,
  Group: HeroSidebar.Group,
  GroupLabel: HeroSidebar.GroupLabel,
  Menu: SidebarMenu,
  MenuSection: HeroSidebar.MenuSection,
  MenuHeader: HeroSidebar.MenuHeader,
  MenuItem: HeroSidebar.MenuItem,
  MenuItemContent: HeroSidebar.MenuItemContent,
  MenuIcon: HeroSidebar.MenuIcon,
  MenuLabel: HeroSidebar.MenuLabel,
  MenuChip: HeroSidebar.MenuChip,
  MenuActions: HeroSidebar.MenuActions,
  MenuAction: HeroSidebar.MenuAction,
  MenuTrigger: HeroSidebar.MenuTrigger,
  MenuIndicator: HeroSidebar.MenuIndicator,
  Submenu: HeroSidebar.Submenu,
  Tooltip: HeroSidebar.Tooltip,
  Separator: HeroSidebar.Separator,
  Mobile: HeroSidebar.Mobile,
  Pages: HeroSidebar.Pages,
  Page: HeroSidebar.Page,
  Rail: SidebarRail,
  Trigger: SidebarTrigger,
  Main: HeroSidebar.Main,
});

export { useSidebar, useSidebarPages } from "@heroui-pro/react/sidebar";
