/**
 * Stackra file contract:
 * Purpose: `TamoStatus`, the one state set every Tamo part shares: idle, working (shimmer, Stop), ready (a draft to review)
 *          and error (Try again).
 * Boundary: the values only; `useTamoTask` moves between them.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
/** The states of one Tamo task. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of here (ADR 0128).
export const TamoStatus = Object.freeze(["idle", "working", "ready", "error"] as const);

/** One state of a Tamo task. */
export type TamoStatus = (typeof TamoStatus)[number];
