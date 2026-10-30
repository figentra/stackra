/**
 * Stackra file contract:
 * Purpose: `useSidebar`, the state of the nearest sidebar for the app's own controls: a header button that toggles it,
 *          a brand node that draws a mark in the rail, a list that reads the filter text.
 * Boundary: reads `SidebarContext`; outside a sidebar it throws, because a control with no sidebar to drive is a bug.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { use } from "react";

import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarState } from "#react/sidebar/sidebar-state.type";

// Developer text, read in the console only, so it stays English (ADR 0080 translates what users see).
const OUTSIDE = "useSidebar must be called inside a SidebarProvider or a Sidebar.";

/** The nearest sidebar's state. */
export function useSidebar(): SidebarState {
  const state = use(SidebarContext);
  if (state === null) throw new Error(OUTSIDE);
  return state;
}
