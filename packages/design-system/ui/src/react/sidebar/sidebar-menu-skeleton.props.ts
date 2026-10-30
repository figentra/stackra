/**
 * Stackra file contract:
 * Purpose: `SidebarMenuSkeletonProps`, the props of the web `Sidebar.MenuSkeleton` in `sidebar-menu-skeleton.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of the web Sidebar.MenuSkeleton: a placeholder row while the menu loads. */
export type SidebarMenuSkeletonProps = Omit<ComponentPropsWithRef<"li">, "children"> & {
  /** False to leave out the icon placeholder. Defaults to true. */
  readonly hasIcon?: boolean | undefined;
};
