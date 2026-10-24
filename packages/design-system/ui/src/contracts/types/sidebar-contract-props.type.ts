/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Sidebar` takes: the navigation it lists, a node above the list (a logo or a
 *          workspace switcher) and one below it (the user menu), and the collapsed state. Each runtime's
 *          `SidebarProps` is this plus its own base props, which pass through unchanged.
 * Boundary: types only. `startContent` is the top of the sidebar and `endContent` its bottom, the logical start and end
 *           of a column. Collapsed is the narrow icon rail of the web sidebar; a phone has no rail, so the native
 *           Sidebar accepts the state and ignores it. The open state of the off-canvas drawer a narrow window shows is
 *           AppShell's, not the Sidebar's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0314 (decisions 1 and 4); WCAG 2.2 SC 1.3.1
 *          and 4.1.2.
 */
import type { NavigationListContractProps } from "#contracts/types/navigation-list-contract-props.type";
import type { ShellSlotsContractProps } from "#contracts/types/shell-slots-contract-props.type";

/** Props shared by the web and native `Sidebar`. */
export interface SidebarContractProps extends NavigationListContractProps, ShellSlotsContractProps {
  /** The collapsed state, for a controlled sidebar; pair it with `onCollapsedChange`. */
  readonly isCollapsed?: boolean | undefined;
  /** The starting collapsed state, for an uncontrolled sidebar. */
  readonly defaultCollapsed?: boolean | undefined;
  /** Called with the new state each time the sidebar collapses or expands, from its own toggle or the app. */
  readonly onCollapsedChange?: ((isCollapsed: boolean) => void) | undefined;
}
