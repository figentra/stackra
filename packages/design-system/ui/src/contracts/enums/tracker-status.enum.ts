/**
 * Stackra file contract:
 * Purpose: `TrackerStatus`, the state of one period of a `TrackerStrip`: `up` (operational), `degraded`, `down`, or
 *          `none` (no data for that period).
 * Boundary: values only; the words live in the `ui` catalogue (`tracker_strip.<status>`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** The states one period of a `TrackerStrip` can be in. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the words live in the ui catalogue.
export const TrackerStatus = Object.freeze(["up", "degraded", "down", "none"] as const);

/** The state of one tracked period. */
export type TrackerStatus = (typeof TrackerStatus)[number];
