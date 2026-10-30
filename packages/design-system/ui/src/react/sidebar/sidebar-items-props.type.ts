/**
 * Stackra file contract:
 * Purpose: `SidebarItemsProps`, the props of the internal `SidebarItems` in `sidebar-items.tsx` (a `.type.ts`, not a `.props.ts`, so the API docs leave the internal part out).
 * Boundary: types only; internal to the Sidebar, not exported from the `./react` entry.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { NavigationItem } from "#contracts/types/navigation-item.type";

/** Props of SidebarItems. */
export interface SidebarItemsProps {
  /** The places to draw. */
  readonly items: readonly NavigationItem[];
  /** True while a filter is applied: every sub-menu opens to show its matches. */
  readonly isFiltered: boolean;
}
