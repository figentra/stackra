/**
 * Stackra file contract:
 * Purpose: the ratings a person gives an assistant's message through MessageActions: thumbs up or thumbs down.
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The message ratings. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the labels live in the catalogue.
export const MessageFeedback = Object.freeze(["up", "down"] as const);

/** One message rating. */
export type MessageFeedback = (typeof MessageFeedback)[number];
