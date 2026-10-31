/**
 * Stackra file contract:
 * Purpose: the states of a `PromptInput`'s one button: `ready` (send), `submitted` (waiting, a spinner), `streaming`
 *          (the reply is coming, so the button stops it) and `error` (send again).
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); STA-1371 (component gaps, owner approval 2026-10-31).
 */

/** The composer's run states. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the labels live in the catalogue.
export const PromptInputStatus = Object.freeze(["ready", "submitted", "streaming", "error"] as const);

/** One run state of the composer. */
export type PromptInputStatus = (typeof PromptInputStatus)[number];
