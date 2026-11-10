/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardState`, what `useSchedulingBoardState` gives both runtimes' SchedulingBoard: the view and
 *          day with their moves, the columns and rows, each row's placed items and shading, the words it writes, the
 *          drag arithmetic (snap, nudge, conflicts) and the commits that report a range or a change.
 * Boundary: types only; internal to the web and native SchedulingBoard.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { CalendarDate } from "@internationalized/date";

import type { SchedulingBoardView } from "#contracts/enums/scheduling-board-view.enum";
import type { SchedulingBoardConflict } from "#contracts/types/scheduling-board-conflict.type";
import type { SchedulingBoardDayMark } from "#contracts/types/scheduling-board-day-mark.type";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import type { PlacedSchedulingItem } from "#core/types/placed-scheduling-item.type";
import type { SchedulingColumn } from "#core/types/scheduling-column.type";
import type { SchedulingRow } from "#core/types/scheduling-row.type";
import type { SchedulingSpan } from "#core/types/scheduling-span.type";

/** The shared SchedulingBoard state. */
export interface SchedulingBoardState {
  /** The view shown. */
  readonly view: SchedulingBoardView;
  /** Shows a view and reports it. */
  readonly setView: (view: SchedulingBoardView) => void;
  /** The day the view holds. */
  readonly date: CalendarDate;
  /** Moves a view's span back or forward. */
  readonly move: (direction: -1 | 1) => void;
  /** Moves the view to show today. */
  readonly goToday: () => void;
  /** The heading: the day, or the first and last day shown. */
  readonly heading: string;
  /** Minutes per slot, after the board's checks. */
  readonly slotMinutes: number;
  /** The columns, earliest first. */
  readonly columns: readonly SchedulingColumn[];
  /** The rows in order, group headings included. */
  readonly rows: readonly SchedulingRow[];
  /** Hides or shows a group's resources. */
  readonly toggleGroup: (group: string) => void;
  /** A resource row's placed items, with pending moves applied. */
  readonly placementsOf: (
    resourceId: string,
    ancestors: readonly string[],
  ) => PlacedSchedulingItem[];
  /** A resource row's stretches outside working time. */
  readonly shadeOf: (resourceId: string) => SchedulingSpan[];
  /** The stretch before now, in columns; 0 when now is before the first column. */
  readonly pastLength: number;
  /** Where now falls, in columns, or null when it is outside the columns. */
  readonly nowAt: number | null;
  /** True when the board takes no drags. */
  readonly readOnly: boolean;
  /** Whether an item may be dragged from a row: not read-only, not a parent's, not marked fixed. */
  readonly canMove: (placed: PlacedSchedulingItem) => boolean;
  /** Whether an item's end may be dragged. */
  readonly canResize: (placed: PlacedSchedulingItem) => boolean;
  /** Whether a moved item waits for the screen's answer. */
  readonly isPending: (itemId: string) => boolean;
  /** A column's header words: the slot's time, or the day in the timeline. */
  readonly columnLabelOf: (column: SchedulingColumn) => string;
  /** A day's header words: weekday and date, in the board's calendar. */
  readonly dayLabelOf: (day: CalendarDate) => string;
  /** A day's standing, when the caller gave one. */
  readonly dayMarkOf: (day: CalendarDate) => SchedulingBoardDayMark | undefined;
  /** A day status's words. */
  readonly dayStatusLabelOf: (mark: SchedulingBoardDayMark) => string;
  /** An item's time, "09:00 – 10:00", or the days of an all-day item. */
  readonly timeOf: (item: SchedulingBoardItem) => string;
  /** An item's spoken name on a row. */
  readonly nameOf: (item: SchedulingBoardItem, resource: SchedulingBoardResource) => string;
  /** An empty slot's spoken name on a row. */
  readonly slotNameOf: (resource: SchedulingBoardResource, column: SchedulingColumn) => string;
  /** A hold's time left, or null when it has none or has lapsed. */
  readonly countdownOf: (item: SchedulingBoardItem) => string | null;
  /** A fill's words, "8/12", in the customer's digits. */
  readonly fillOf: (item: SchedulingBoardItem) => string | null;
  /** A parent's name for an inherited item, "From Pitch". */
  readonly inheritedLabelOf: (item: SchedulingBoardItem, ancestors: readonly string[]) => string;
  /** A moment rounded to the slot grid (whole days in the timeline). */
  readonly snap: (at: Date) => Date;
  /** The moment at a position in columns, snapped. */
  readonly timeAt: (position: number) => Date;
  /** A draft shifted by whole columns (a slot, or a day in the timeline) and rows; resizing moves only its end. */
  readonly nudge: (
    draft: SchedulingBoardDraft,
    steps: number,
    rows: number,
    resize: boolean,
  ) => SchedulingBoardDraft;
  /** The board's and the screen's conflicts at a draft, each with words. */
  readonly conflictsOf: (draft: SchedulingBoardDraft) => readonly SchedulingBoardConflict[];
  /** Reports a selected range. */
  readonly commitRange: (draft: SchedulingBoardDraft) => void;
  /** Reports a move or resize, holding the item pending while the screen's promise is open. */
  readonly commitChange: (draft: SchedulingBoardDraft) => void;
  /** Says words in the board's live region. */
  readonly announce: (words: string) => void;
  /** The live region's words. */
  readonly announcement: string;
  /** The words of a drag's start, for the live region; `touch` words a drag by finger instead of by keys. */
  readonly startWordsOf: (
    draft: SchedulingBoardDraft,
    title: string | null,
    touch?: boolean,
  ) => string;
  /** Looks a resource up by id. */
  readonly resourceOf: (id: string) => SchedulingBoardResource | undefined;
}
