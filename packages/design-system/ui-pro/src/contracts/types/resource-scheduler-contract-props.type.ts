/**
 * Stackra file contract:
 * Purpose: the props of the `ResourceScheduler`: the days and resources as columns, the visible hours, the snap step,
 *          the bookings, and the handler a move or a resize reports to, with the labels it announces.
 * Boundary: types only. Opening hours, the working week and the slot length are the caller's data (settings and the
 *           market pack), never defaults here. The scheduler proposes a change; the caller saves or refuses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); config-model sections 1 and 3.
 */
import type { SchedulerView } from "#contracts/enums/scheduler-view.enum";
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import type { SchedulerResource } from "#contracts/types/scheduler-resource.type";

/** Props of the `ResourceScheduler`. */
export interface ResourceSchedulerContractProps {
  /** The scheduler's name for screen readers. */
  readonly label: string;
  /** One day or a week. */
  readonly view: SchedulerView;
  /** The ISO dates shown: one for a day, the working days for a week. */
  readonly days: readonly string[];
  /** The resources, one column each per day. */
  readonly resources: readonly SchedulerResource[];
  /** The first minute shown, from midnight. */
  readonly startMinute: number;
  /** The last minute shown, from midnight. */
  readonly endMinute: number;
  /** The step a move or a resize snaps to, in minutes. */
  readonly slotMinutes: number;
  /** The height of one slot, in pixels. */
  readonly slotHeight?: number | undefined;
  /** The bookings. */
  readonly events: readonly SchedulerEvent[];
  /** Called with the booking as it would be after a move or a resize. */
  readonly onEventChange?: ((event: SchedulerEvent) => void) | undefined;
  /** Formats a minute from midnight for the time axis and announcements (`9:30`, `٩:٣٠`). */
  readonly formatMinute: (minute: number) => string;
  /** Formats an ISO date for the column headers and announcements (`Mon 2 Nov`). */
  readonly formatDay: (day: string) => string;
  /** The keyboard help read with every booking. */
  readonly keyboardHint: string;
}
