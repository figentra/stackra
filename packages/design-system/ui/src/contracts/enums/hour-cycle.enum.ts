/**
 * Stackra file contract:
 * Purpose: `HourCycle`, how a time field or picker counts hours: 12 with AM and PM, or 24.
 * Boundary: the values only; the locale decides when none is given.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */

/** The hour cycles. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const HourCycle = Object.freeze([12, 24] as const);

/** One hour cycle. */
export type HourCycle = (typeof HourCycle)[number];
