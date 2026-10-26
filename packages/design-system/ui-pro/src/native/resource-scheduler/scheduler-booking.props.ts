/**
 * Stackra file contract:
 * Purpose: `SchedulerBookingProps`, the props of one booking block the native `ResourceScheduler` draws: where it sits,
 *          what it reads out, and the callbacks a drag or a screen-reader action reports to.
 * Boundary: internal to the native scheduler; the scheduler turns the reported distances and actions into bookings.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 (a single-pointer way for every drag).
 */
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";

/** A screen-reader action on a booking, named after its `ui_pro::scheduler.*` key. */
export type SchedulerBookingAction =
  | "move_earlier"
  | "move_later"
  | "move_previous"
  | "move_next"
  | "lengthen"
  | "shorten";

/** Props of one booking block. */
export interface SchedulerBookingProps {
  /** The booking as drawn: the preview while it is dragged. */
  readonly event: SchedulerEvent;
  /** The distance from the column's top, in points. */
  readonly top: number;
  /** The block's height, in points. */
  readonly height: number;
  /** Its side-by-side lane and the lane count of its cluster. */
  readonly lane: { readonly lane: number; readonly lanes: number };
  /** Points per minute on the time axis, for the processing gaps. */
  readonly perMinute: number;
  /** False to fix it in place: no drag, no actions. */
  readonly isMovable: boolean;
  /** The block's accessible name: title, resource, day and times. */
  readonly label: string;
  /** The help read with it. */
  readonly hint: string;
  /** The names read for each action. */
  readonly actionLabels: Readonly<Record<SchedulerBookingAction, string>>;
  /** Called while a finger drags the block (`move`) or its bottom edge (`resize`), with the distance so far. */
  readonly onDrag: (mode: "move" | "resize", dx: number, dy: number) => void;
  /** Called when the finger lifts, with the final distance. */
  readonly onDrop: (mode: "move" | "resize", dx: number, dy: number) => void;
  /** Called when the drag is taken away by the system. */
  readonly onCancel: () => void;
  /** Called with a screen-reader action. */
  readonly onAction: (action: SchedulerBookingAction) => void;
}
