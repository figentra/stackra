/**
 * Stackra file contract:
 * Purpose: where the toast region sits along its edge: the inline `start`, the `center`, the inline `end`, or `full`
 *          width. Start and end follow the text direction.
 * Boundary: the values only; each `ToastProvider` maps them onto its HeroUI part.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2); ADR 0060 (right-to-left).
 */

/** The toast alignments. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the alignments carry no labels.
export const ToastAlign = Object.freeze(["start", "center", "end", "full"] as const);

/** One toast alignment. */
export type ToastAlign = (typeof ToastAlign)[number];
