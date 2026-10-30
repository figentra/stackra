/**
 * Stackra file contract:
 * Purpose: how a modal enters: `slide-up` (rises from the bottom edge), `stick-top` (drops from the top and stays
 *          flush with it) or `slide-side` (slides in from the inline-end side, full height). Left out, the modal keeps
 *          its own fade and zoom.
 * Boundary: the values only; each `Modal` maps them onto its HeroUI part.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3); ADR 0060 (right-to-left).
 */

/** The overlay motions. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the motions carry no labels.
export const OverlayMotion = Object.freeze(["slide-up", "stick-top", "slide-side"] as const);

/** One overlay motion. */
export type OverlayMotion = (typeof OverlayMotion)[number];
