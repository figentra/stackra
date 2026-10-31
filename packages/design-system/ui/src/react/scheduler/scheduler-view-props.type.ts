/**
 * Stackra file contract:
 * Purpose: `SchedulerViewProps`, the props of the web Scheduler's internal views (time grid, month, agenda).
 * Boundary: types only; internal.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { SchedulerContractProps } from "#contracts/types/scheduler-contract-props.type";
import type { SchedulerState } from "#react/hooks/scheduler-state.type";

/** Props of one Scheduler view. */
export type SchedulerViewProps = Pick<
  SchedulerContractProps,
  "events" | "onEventPress" | "onSlotPress"
> & {
  /** The shared state. */
  readonly state: SchedulerState;
};
