/**
 * Stackra file contract:
 * Purpose: the looks of a Sidebar: `sidebar` sits flush against its edge with a rule on its inner side, `floating` is
 *          an inset card clear of the edges (the Drawer's look), and `inset` leaves the sidebar on the page background
 *          and lifts the content beside it (`Sidebar.Inset`) into a rounded panel.
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317; owner request 2026-10-29 (STA-1371, robust sidebar).
 */

/** The sidebar looks. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the looks carry no labels.
export const SidebarVariant = Object.freeze(["sidebar", "floating", "inset"] as const);

/** One sidebar look. */
export type SidebarVariant = (typeof SidebarVariant)[number];
