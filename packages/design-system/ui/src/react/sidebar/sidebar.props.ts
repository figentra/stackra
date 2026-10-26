/**
 * Stackra file contract:
 * Purpose: `SidebarProps`, the props of the web `Sidebar` in `sidebar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0317 (decisions 1, 4 and 5); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import type { ComponentPropsWithRef } from "react";
import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";

/**
 * Props of the web Sidebar: the shared contract plus the root `div`'s own props, passed through. The sidebar's content
 * is `items` and its two slots, so the type refuses JSX children.
 */
export type SidebarProps = SidebarContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof SidebarContractProps | "children"> & {
    /** False to leave out the collapse toggle, for a sidebar drawn inside AppShell's drawer. Defaults to true. */
    readonly isCollapsible?: boolean | undefined;
  };
