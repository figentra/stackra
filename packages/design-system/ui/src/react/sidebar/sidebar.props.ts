/**
 * Stackra file contract:
 * Purpose: `SidebarProps`, the props of the web `Sidebar` in `sidebar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0317 (decisions 1, 4 and 5); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import type { ComponentPropsWithRef, ReactNode } from "react";

import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";
import type { SidebarStateProps } from "#react/sidebar/sidebar-state-props.type";

/**
 * Props of the web Sidebar: the shared contract, the web state props (read only when no `SidebarProvider` is around
 * it, which then owns the state), and the root `div`'s own props, passed through.
 */
export type SidebarProps = SidebarContractProps &
  SidebarStateProps &
  Omit<
    ComponentPropsWithRef<"div">,
    keyof SidebarContractProps | keyof SidebarStateProps | "children"
  > & {
    /** False to leave out the collapse toggle and keep the sidebar open: the same as `collapsible="none"`. */
    readonly isCollapsible?: boolean | undefined;
    /** The parts, when the sidebar is composed instead of drawn from `items`: Header, Content, Footer and Rail. */
    readonly children?: ReactNode;
  };
