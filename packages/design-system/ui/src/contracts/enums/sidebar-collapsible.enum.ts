/**
 * Stackra file contract:
 * Purpose: how a Sidebar collapses: `icon` narrows it to a rail of icons with tooltips, `offcanvas` slides it out of
 *          the page entirely (a trigger outside brings it back), and `none` keeps it open with no toggle.
 * Boundary: the values only. Below the mobile breakpoint every mode becomes a drawer instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317; owner request 2026-10-29 (STA-1371, robust sidebar).
 */

/** The ways a sidebar collapses. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the modes carry no labels.
export const SidebarCollapsible = Object.freeze(["icon", "offcanvas", "none"] as const);

/** One collapse mode. */
export type SidebarCollapsible = (typeof SidebarCollapsible)[number];
