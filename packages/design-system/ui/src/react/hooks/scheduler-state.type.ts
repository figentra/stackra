/**
 * Stackra file contract:
 * Purpose: `SchedulerState`, what `useSchedulerState` returns: the view, the day, the navigation and the words, for
 *          the web and native Scheduler's views.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { useSchedulerState } from "#react/hooks/use-scheduler-state";

/** The shared scheduler state. */
export type SchedulerState = ReturnType<typeof useSchedulerState>;
