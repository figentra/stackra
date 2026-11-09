/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardContractProps`, the props every runtime's `SchedulingBoard` takes: the rows and the items,
 *          the view and the day shown (each controlled or not), the slot grid and hours, working time and the day
 *          marks, the calendar, and what selecting, moving, resizing and pressing report.
 * Boundary: types only; the board is a pure view: it never fetches or writes, never refuses a drop, and holds a moved
 *           item where it was dropped only while `onItemChange`'s promise is open.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { CalendarDate } from "@internationalized/date";
import type { ReactNode } from "react";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { SchedulingBoardView } from "#contracts/enums/scheduling-board-view.enum";
import type { SchedulingBoardChange } from "#contracts/types/scheduling-board-change.type";
import type { SchedulingBoardConflict } from "#contracts/types/scheduling-board-conflict.type";
import type { SchedulingBoardDayMark } from "#contracts/types/scheduling-board-day-mark.type";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { SchedulingBoardInterval } from "#contracts/types/scheduling-board-interval.type";
import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardRange } from "#contracts/types/scheduling-board-range.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";

/** Props shared by the web and native `SchedulingBoard`. */
export interface SchedulingBoardContractProps {
  /** The spoken name of the board, for example "Branch schedule". */
  readonly label: string;
  /** The rows, in order within their group. */
  readonly resources: readonly SchedulingBoardResource[];
  /** The blocks; those that overlap on a row lie side by side. */
  readonly items: readonly SchedulingBoardItem[];
  /** The view, for a controlled board. */
  readonly view?: SchedulingBoardView | undefined;
  /** The starting view, for an uncontrolled one; `day` by default. */
  readonly defaultView?: SchedulingBoardView | undefined;
  /** Called with each view chosen. */
  readonly onViewChange?: ((view: SchedulingBoardView) => void) | undefined;
  /** The day the view holds, for a controlled board. */
  readonly date?: CalendarDate | undefined;
  /** The starting day, for an uncontrolled one; today by default. */
  readonly defaultDate?: CalendarDate | undefined;
  /** Called with the day the view holds after previous, next or Today. */
  readonly onDateChange?: ((date: CalendarDate) => void) | undefined;
  /** The days the timeline view spans, 1 to 62; 14 by default. */
  readonly timelineDays?: number | undefined;
  /** The IANA time zone of the node the board shows; the device's by default. */
  readonly timeZone?: string | undefined;
  /** The length of a slot in minutes, the step every drag snaps to: 5 to 60, a divisor of 60; 15 by default. */
  readonly slotMinutes?: number | undefined;
  /** The first hour the day and week views show, 0 to 23; 0 by default. */
  readonly startHour?: number | undefined;
  /** The hour the day and week views end at, 1 to 24; 24 by default. */
  readonly endHour?: number | undefined;
  /** Working time, expanded for the range shown; time outside a row's stretches is shaded. None shades nothing. */
  readonly workingTime?: readonly SchedulingBoardInterval[] | undefined;
  /** Each day's standing, for the header; a rest day or holiday is shaded. */
  readonly dayMarks?: readonly SchedulingBoardDayMark[] | undefined;
  /** The calendar the headers write dates in; `islamic-umalqura` for Hijri. Gregorian by default. */
  readonly calendar?: CalendarSystem | undefined;
  /** The moment taken as now, for the current-time line, Today and the past's shading; the clock at mount by default. */
  readonly now?: Date | undefined;
  /** True to let nothing be selected, moved or resized; items stay pressable. */
  readonly readOnly?: boolean | undefined;
  /** True to show a skeleton instead of the rows. */
  readonly isLoading?: boolean | undefined;
  /** A screen's own conflicts for a drag's would-be result, merged with the board's; called as the preview moves. */
  readonly conflictsOf?:
    | ((draft: SchedulingBoardDraft) => readonly SchedulingBoardConflict[])
    | undefined;
  /** Called with an empty range selected, by dragging across slots or from the keyboard. */
  readonly onSelectRange?: ((range: SchedulingBoardRange) => void) | undefined;
  /**
   * Called when an item is moved or resized. A promise holds the item where it was dropped, pending, until it settles;
   * `false` puts it back. Anything else is taken as accepted: the screen passes the new items.
   */
  // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: a plain handler returns nothing; a promise asks to hold the item
  readonly onItemChange?: ((change: SchedulingBoardChange) => void | Promise<boolean>) | undefined;
  /** Called when an item is pressed, for example to open its register. */
  readonly onItemPress?: ((item: SchedulingBoardItem) => void) | undefined;
  /** A block's content; the title, the time, the fill and a hold's countdown by default. */
  readonly renderItem?: ((item: SchedulingBoardItem) => ReactNode) | undefined;
}
