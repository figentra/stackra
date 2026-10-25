/**
 * Stackra file contract:
 * Purpose: the spans a `ResourceScheduler` shows: one day, or the days of a week the caller gives.
 * Boundary: the values only. Which days make a week (the working week) is market data the caller passes as `days`.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); config-model section 1 (the working week is a market-pack value).
 */

/** The scheduler views. */
// shortcut: a frozen tuple, as the @stackra/ui contracts' enums are, until Enum.of reaches the contracts (ADR 0128).
export const SchedulerView = Object.freeze(["day", "week"] as const);

/** One scheduler view. */
export type SchedulerView = (typeof SchedulerView)[number];
