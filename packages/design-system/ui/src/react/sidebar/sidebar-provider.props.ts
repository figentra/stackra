/**
 * Stackra file contract:
 * Purpose: `SidebarProviderProps`, the props of the web `SidebarProvider` in `sidebar-provider.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import type { ComponentPropsWithRef, ReactNode } from "react";

import type { SidebarStateProps } from "#react/sidebar/sidebar-state-props.type";

/** Props of the web SidebarProvider: the state props, the layout it wraps, and the wrapper `div`'s own props. */
export type SidebarProviderProps = SidebarStateProps &
  Omit<ComponentPropsWithRef<"div">, keyof SidebarStateProps | "children"> & {
    /** The layout: a `Sidebar` and the `Sidebar.Inset` beside it, with any `Sidebar.Trigger` placed anywhere inside. */
    readonly children?: ReactNode;
  };
