/**
 * Stackra file contract:
 * Purpose: `SidebarSeparatorProps`, the props of the web `Sidebar.Separator` in `sidebar-separator.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of the web Sidebar.Separator: an `hr`'s props. */
export type SidebarSeparatorProps = Omit<ComponentPropsWithRef<"hr">, "children">;
