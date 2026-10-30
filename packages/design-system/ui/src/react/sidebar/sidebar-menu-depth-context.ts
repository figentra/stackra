/**
 * Stackra file contract:
 * Purpose: `SidebarMenuDepthContext`, how deep the nearest `Sidebar.MenuItem` is nested: 0 in a menu, 1 in a sub-menu.
 * Boundary: the context only; `Sidebar.MenuItem` reads it to draw a nested entry smaller, and provides one more to its
 *           own sub-menu.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { createContext } from "react";

/** The nesting depth of the entries below. */
export const SidebarMenuDepthContext = createContext(0);
