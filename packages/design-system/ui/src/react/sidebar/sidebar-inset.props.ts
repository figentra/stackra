/**
 * Stackra file contract:
 * Purpose: `SidebarInsetProps`, the props of the web `Sidebar.Inset` in `sidebar-inset.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of the web Sidebar.Inset: a `div`'s props; its children are the page beside the sidebar (put the page's `main` inside). */
export type SidebarInsetProps = ComponentPropsWithRef<"div">;
