/**
 * Stackra file contract:
 * Purpose: the states of a SidePanel: `closed` (out of the page, its launcher shown), `open` (a column at the end edge
 *          that pushes the page) and `expanded` (it takes the whole content area).
 * Boundary: the values only. On a small screen `open` and `expanded` are both a drawer over the page.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317; owner request 2026-10-29 (STA-1371, side panel).
 */

/** The states of a side panel. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the states carry no labels.
export const SidePanelState = Object.freeze(["closed", "open", "expanded"] as const);

/** One side panel state. */
export type SidePanelState = (typeof SidePanelState)[number];
