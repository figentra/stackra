/**
 * Stackra file contract:
 * Purpose: `DateLabelContractProps`, the props shared by the web and native `DateLabel`.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { DateLabelKind } from "#contracts/enums/date-label-kind.enum";
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `DateLabel`. */
export interface DateLabelContractProps {
  /** The date: a `Date`, or an ISO 8601 string as an API sends it. An invalid date draws nothing. */
  readonly date: Date | string;
  /** What the date means; `date` (the default) shows no state, `due` can be due soon or overdue, `expiry` can be
   *  expiring soon or expired. */
  readonly kind?: DateLabelKind | undefined;
  /** How many days ahead a due date or expiry counts as soon; defaults to 3. A market pack can change it. */
  readonly soonDays?: number | undefined;
  /** True (the default) to write a date within a week as "tomorrow" or "3 days ago"; the full date is always read
   *  out and shown on hover. */
  readonly isRelative?: boolean | undefined;
  /** The calendar the full date is written in; defaults to `gregory`. */
  readonly calendar?: CalendarSystem | undefined;
  /** "Now", for a fixed point in a test or a demo; defaults to the moment the label mounted. */
  readonly now?: Date | undefined;
  /** The chip's size; defaults to `sm`. */
  readonly size?: Size | undefined;
  /** False to skip the single attention pulse an overdue or expired label plays when it appears. */
  readonly isAnimated?: boolean | undefined;
}
