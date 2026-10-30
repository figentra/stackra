/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Sidebar` takes: the navigation it lists (or composed parts), a node above the list
 *          (a logo or a workspace switcher) and one below it (the user menu), its look, how it collapses, the collapsed
 *          state, the open state of its phone drawer, a filter box and a loading state. Each runtime's `SidebarProps`
 *          is this plus its own base props, which pass through unchanged.
 * Boundary: types only. `startContent` is the top of the sidebar and `endContent` its bottom, the logical start and end
 *           of a column. `items` draws the whole sidebar from data; leave it out and compose the parts as children
 *           instead. Collapsed is the narrow icon rail (or the slid-away panel, by `collapsible`); on a phone the
 *           sidebar is a drawer whose open state is `isMobileOpen`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1 and 4); WCAG 2.2 SC 1.3.1
 *          and 4.1.2; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import type { SidebarCollapsible } from "#contracts/enums/sidebar-collapsible.enum";
import type { SidebarVariant } from "#contracts/enums/sidebar-variant.enum";
import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import type { ShellSlotsContractProps } from "#contracts/types/shell-slots-contract-props.type";

/** Props shared by the web and native `Sidebar`. */
export interface SidebarContractProps extends LandmarkContractProps, ShellSlotsContractProps {
  /**
   * The places, in order: a top-level entry with `children` and no `href` is a labelled group, an entry with `href` and
   * `children` opens a nested list. Left out, the sidebar draws the parts given as children.
   */
  readonly items?: readonly NavigationItem[] | undefined;
  /** The look: `sidebar` (flush, the default), `floating` (an inset card) or `inset` (the content is the card). */
  readonly variant?: SidebarVariant | undefined;
  /** How it collapses: `icon` (a rail of icons, the default), `offcanvas` (slides away) or `none`. */
  readonly collapsible?: SidebarCollapsible | undefined;
  /** The collapsed state, for a controlled sidebar; pair it with `onCollapsedChange`. */
  readonly isCollapsed?: boolean | undefined;
  /** The starting collapsed state, for an uncontrolled sidebar. */
  readonly defaultCollapsed?: boolean | undefined;
  /** Called with the new state each time the sidebar collapses or expands, from its toggle, its shortcut or the app. */
  readonly onCollapsedChange?: ((isCollapsed: boolean) => void) | undefined;
  /** Whether the phone drawer is open, for a controlled drawer; pair it with `onMobileOpenChange`. */
  readonly isMobileOpen?: boolean | undefined;
  /** Called with the new state each time the phone drawer opens or closes. */
  readonly onMobileOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** True to draw a filter box above the `items`, which hides the places whose label does not match. */
  readonly isSearchable?: boolean | undefined;
  /** True while the `items` load: placeholder rows stand in their place. */
  readonly isLoading?: boolean | undefined;
}
