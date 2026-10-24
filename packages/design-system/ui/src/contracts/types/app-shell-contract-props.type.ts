/**
 * Stackra file contract:
 * Purpose: the props every runtime's `AppShell` takes: the frame of the console. It holds a sidebar, a header and the
 *          page, and below `collapseBelow` it moves the sidebar into an off-canvas drawer (a bottom sheet on native)
 *          that the app opens through the open state. Each runtime's `AppShellProps` is this plus its own base props,
 *          which pass through unchanged.
 * Boundary: types only. The three regions are nodes, so AppShell imports no other shell piece (ADR 0317 decision 4):
 *           the app puts a Sidebar in `sidebar`, an AppHeader in `header` and the page in `children`, and the button that
 *           opens the drawer is a node in the header's own `startContent`. `sidebar` may be a function of the
 *           {@link AppShellSidebarState} so the sidebar can draw itself in full inside the drawer.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (the open state); ADR 0317 (decisions 1, 4,
 *          5 and 6); WCAG 2.2 SC 2.4.1, 1.4.10 and 1.3.1.
 */
import type { ReactNode } from "react";

import type { AppShellSidebarState } from "#contracts/types/app-shell-sidebar-state.type";
import type { LayoutBreakpointContractProps } from "#contracts/types/layout-breakpoint-contract-props.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `AppShell`. */
export interface AppShellContractProps
  extends LayoutBreakpointContractProps, OpenStateContractProps {
  /** The page: it is drawn inside the one `main` landmark of the shell. */
  readonly children: ReactNode;
  /** The sidebar, usually a `Sidebar`; a function receives where it is drawn. Left out, the shell has no sidebar. */
  readonly sidebar?: ReactNode | ((state: AppShellSidebarState) => ReactNode) | undefined;
  /** The bar above the page, usually an `AppHeader`. */
  readonly header?: ReactNode | undefined;
}
