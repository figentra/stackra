/**
 * Stackra file contract:
 * Purpose: `SidebarMenuProps`, the props of the web `Sidebar.Menu` in `sidebar-menu.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of the web Sidebar.Menu: a `ul`'s props; its children are `Sidebar.MenuItem`s. */
export type SidebarMenuProps = ComponentPropsWithRef<"ul">;
