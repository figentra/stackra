/**
 * Stackra file contract:
 * Purpose: `ROUTE_PROGRESS_TIMING`, the route bar's trickle: where the fill starts, where it creeps towards, the share
 *          of the gap one step closes, the step interval and the fade-out, shared by both runtimes.
 * Boundary: data only; internal.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0305 (one declaration per file).
 */

/** The trickle's numbers; times in ms. */
export const ROUTE_PROGRESS_TIMING = Object.freeze({
  start: 0.08,
  ceiling: 0.9,
  step: 0.1,
  trickleMs: 250,
  fadeMs: 300,
});
