/**
 * Stackra file contract:
 * Purpose: `SchedulerContractProps`, the props every runtime's `Scheduler` takes: the events, the view and the day
 *          shown (each controlled or not), the hours of the time grid, the time zone, and what a press on an event, an
 *          empty hour or a day does.
 * Boundary: types only; the events are the caller's: the Scheduler places and names them and never edits them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { CalendarDate } from "@internationalized/date";

import type { SchedulerView } from "#contracts/enums/scheduler-view.enum";
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";

/** Props shared by the web and native `Scheduler`. */
export interface SchedulerContractProps {
  /** The events to place. */
  readonly events: readonly SchedulerEvent[];
  /** The view, for a controlled scheduler. */
  readonly view?: SchedulerView | undefined;
  /** The starting view, for an uncontrolled one; `week` by default. */
  readonly defaultView?: SchedulerView | undefined;
  /** Called with each view chosen. */
  readonly onViewChange?: ((view: SchedulerView) => void) | undefined;
  /** The day the view holds, for a controlled scheduler. */
  readonly date?: CalendarDate | undefined;
  /** The starting day, for an uncontrolled one; today by default. */
  readonly defaultDate?: CalendarDate | undefined;
  /** Called with the day the view holds after previous, next, Today or a press on a date. */
  readonly onDateChange?: ((date: CalendarDate) => void) | undefined;
  /** The first hour of the time grid, 0 to 23; 0 by default. */
  readonly startHour?: number | undefined;
  /** The hour the time grid ends at, 1 to 24; 24 by default. */
  readonly endHour?: number | undefined;
  /** The IANA time zone the events are read in; the device's by default. */
  readonly timeZone?: string | undefined;
  /** Called when an event is pressed. */
  readonly onEventPress?: ((event: SchedulerEvent) => void) | undefined;
  /** Makes each empty hour of the day and week views a button; called with the start of the hour pressed. */
  readonly onSlotPress?: ((start: Date) => void) | undefined;
  /** The moment taken as now, for the current-time line and Today; the clock at mount by default. */
  readonly now?: Date | undefined;
  /** The spoken name of the scheduler, for example "Clinic bookings". */
  readonly label: string;
}
