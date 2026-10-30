/**
 * Stackra file contract:
 * Purpose: the looks of a SidePanel: `attached`, a column joined to the page by a border; `split`, the page and the
 *          panel as two rounded cards on the app's background with a gap around and between them.
 * Boundary: the values only. On a small screen both are the same drawer.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); owner request 2026-10-29 (STA-1371, side panel split look).
 */

/** The looks of a side panel. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the looks carry no labels.
export const SidePanelVariant = Object.freeze(["attached", "split"] as const);

/** One side panel look. */
export type SidePanelVariant = (typeof SidePanelVariant)[number];
