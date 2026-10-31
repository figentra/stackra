/**
 * Stackra file contract:
 * Purpose: `SCHEDULER_STEP`, how far previous and next move each `Scheduler` view: a day, a week or a month.
 * Boundary: a constant only; durations in `@internationalized/date`'s shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { SchedulerView } from "#contracts/enums/scheduler-view.enum";

/** The step of each view. */
export const SCHEDULER_STEP = Object.freeze({
  day: { days: 1 },
  week: { weeks: 1 },
  month: { months: 1 },
  agenda: { months: 1 },
} as const satisfies Record<SchedulerView, { days?: number; weeks?: number; months?: number }>);
