/**
 * Stackra file contract:
 * Purpose: `SidebarState`, what a `SidebarProvider` (or a Sidebar drawn on its own) shares with its parts and with
 *          `useSidebar`: the collapsed and phone-drawer states and their setters, the look, the collapse mode, the
 *          width, the filter text and whether the parts draw as the icon rail.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import type { SidebarCollapsible } from "#contracts/enums/sidebar-collapsible.enum";
import type { SidebarVariant } from "#contracts/enums/sidebar-variant.enum";

/** The shared state of one sidebar. */
export interface SidebarState {
  /** The id of the sidebar's panel, for a trigger's `aria-controls`. */
  readonly panelId: string;
  /** True when the sidebar is collapsed (the rail, or slid away). */
  readonly isCollapsed: boolean;
  /** Collapses (true) or expands (false) the sidebar. */
  readonly setCollapsed: (isCollapsed: boolean) => void;
  /** Flips the state the sidebar is in now: the phone drawer below the breakpoint, the collapsed state above it. */
  readonly toggle: () => void;
  /** How the sidebar collapses. */
  readonly collapsible: SidebarCollapsible;
  /** The sidebar's look. */
  readonly variant: SidebarVariant;
  /** True below the mobile breakpoint, where the sidebar is a drawer. */
  readonly isMobile: boolean;
  /** Whether the phone drawer is open. */
  readonly isMobileOpen: boolean;
  /** Opens or closes the phone drawer. */
  readonly setMobileOpen: (isOpen: boolean) => void;
  /** True while the parts draw as the icon rail: collapsed in `icon` mode, above the breakpoint, and not peeking. */
  readonly isRail: boolean;
  /** True while a collapsed rail shows in full because the pointer rests on it (`isExpandOnHover`). */
  readonly isPeeking: boolean;
  /** Starts or ends the peek. */
  readonly setPeeking: (isPeeking: boolean) => void;
  /** True when the rail opens in full while the pointer rests on it. */
  readonly isExpandOnHover: boolean;
  /** The expanded width in pixels. */
  readonly width: number;
  /** Sets the expanded width, clamped between `minWidth` and `maxWidth`. */
  readonly setWidth: (width: number) => void;
  /** The narrowest the sidebar can be dragged, in pixels. */
  readonly minWidth: number;
  /** The widest the sidebar can be dragged, in pixels. */
  readonly maxWidth: number;
  /** True when the sidebar can be resized from its rail. */
  readonly isResizable: boolean;
  /** The filter text of `Sidebar.Search`. */
  readonly query: string;
  /** Sets the filter text. */
  readonly setQuery: (query: string) => void;
  /** True when the state comes from an explicit `SidebarProvider`, false when a Sidebar made its own. */
  readonly isProvided: boolean;
}
