/**
 * Stackra file contract:
 * Purpose: How a PressFeedback answers a press: it shrinks a little, a highlight washes over it, or a ripple spreads from the touch (web shows the highlight).
 * Boundary: the values only; each runtime maps them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile interactions (owner
 *          approval 2026-10-28).
 */

/** How a PressFeedback answers a press: it shrinks a little, a highlight washes over it, or a ripple spreads from the touch (web shows the highlight). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the values carry no labels.
export const PressFeedbackKind = Object.freeze(["scale", "highlight", "ripple"] as const);

/** One value of `PressFeedbackKind`. */
export type PressFeedbackKind = (typeof PressFeedbackKind)[number];
