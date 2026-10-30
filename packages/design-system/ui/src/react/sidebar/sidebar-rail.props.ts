/**
 * Stackra file contract:
 * Purpose: `SidebarRailProps`, the props of the web `Sidebar.Rail` in `sidebar-rail.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of the web Sidebar.Rail: a `div`'s props; the rail has no content of its own. */
export type SidebarRailProps = Omit<ComponentPropsWithRef<"div">, "children">;
