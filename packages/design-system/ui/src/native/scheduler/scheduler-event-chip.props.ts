/**
 * Stackra file contract:
 * Purpose: `SchedulerEventChipProps`, the props of the native Scheduler's internal event chip.
 * Boundary: types only; internal.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { ViewStyle } from "react-native";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import type { SchedulerState } from "#react/hooks/scheduler-state.type";

/** Props of one event chip. */
export interface SchedulerEventChipProps {
  /** The event. */
  readonly event: SchedulerEvent;
  /** The shared state, for the event's time and name. */
  readonly state: SchedulerState;
  /** Called on a press; without it the chip is not a button. */
  readonly onPress?: ((event: SchedulerEvent) => void) | undefined;
  /** True for a one-line chip (month, all-day and agenda rows). */
  readonly isCompact?: boolean | undefined;
  /** Places a timed chip in its day column. */
  readonly style?: ViewStyle | undefined;
}
