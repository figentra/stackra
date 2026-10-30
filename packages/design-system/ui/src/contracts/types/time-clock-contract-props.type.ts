/**
 * Stackra file contract:
 * Purpose: `TimeClockContractProps`, the props every runtime's `TimeClock` takes: a time of day picked on an analogue
 *          face, the hours first and then the minutes.
 * Boundary: types only. The face is never mirrored: clocks run clockwise in Arabic too. Its numerals are the
 *           customer's digits, and the time above it reads hours then minutes as clocks do everywhere.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeValue } from "#contracts/types/time-value.type";

/** Props shared by the web and native `TimeClock`. */
export interface TimeClockContractProps {
  /** The time, for a controlled clock. */
  readonly value?: TimeValue | undefined;
  /** The starting time, for an uncontrolled clock; defaults to 12:00. */
  readonly defaultValue?: TimeValue | undefined;
  /** Called with each new time. */
  readonly onChange?: ((value: TimeValue) => void) | undefined;
  /** The minutes the minute hand snaps to, for example 5 or 15; defaults to 1. */
  readonly minuteStep?: number | undefined;
  /** 12 hours with AM and PM, or 24 hours on two rings; defaults to the locale's. */
  readonly hourCycle?: HourCycle | undefined;
  /** The clock's name, for example "Pickup time". */
  readonly label?: string | undefined;
  /** True to show the time but refuse changes. */
  readonly isDisabled?: boolean | undefined;
}
