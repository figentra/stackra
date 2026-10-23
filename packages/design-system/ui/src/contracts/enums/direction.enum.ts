/**
 * Stackra file contract:
 * Purpose: the text directions: left-to-right and right-to-left.
 * Boundary: the values only; `directionOf` in core derives one from a locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (logical CSS, right-to-left).
 */

/** The text directions, as the HTML `dir` attribute writes them. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const Direction = Object.freeze(["ltr", "rtl"] as const);

/** One text direction. */
export type Direction = (typeof Direction)[number];
