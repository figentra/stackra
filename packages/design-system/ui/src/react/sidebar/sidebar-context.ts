/**
 * Stackra file contract:
 * Purpose: `SidebarContext`, the state of the nearest sidebar, or null outside one.
 * Boundary: the context only; `SidebarProvider` provides it, the Sidebar's parts and `useSidebar` read it.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { createContext } from "react";

import type { SidebarState } from "#react/sidebar/sidebar-state.type";

/** The sidebar the reader sits in, or null outside any. */
export const SidebarContext = createContext<SidebarState | null>(null);
