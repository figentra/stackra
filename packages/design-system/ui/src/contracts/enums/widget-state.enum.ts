/**
 * Stackra file contract:
 * Purpose: `WidgetState`, what a dashboard widget's body shows: its content, a skeleton, an empty note or an error.
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 14 and 18: widgets in slots); ADR 0305 (one declaration per file).
 */

/** The states of a widget frame. */
export const WidgetState = Object.freeze(["ready", "loading", "empty", "error"] as const);

/** One widget state. */
export type WidgetState = (typeof WidgetState)[number];
