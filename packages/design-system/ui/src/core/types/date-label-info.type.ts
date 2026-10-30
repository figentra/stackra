/**
 * Stackra file contract:
 * Purpose: `DateLabelInfo`, what `dateLabelOf` works out for a `DateLabel`: its state, tone and the two texts.
 * Boundary: a type only, in its own file; internal to the package.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { Tone } from "@stackra/contracts";
import type { DateLabelState } from "#contracts/enums/date-label-state.enum";

/** A date label worked out. */
export interface DateLabelInfo {
  /** The state, `none` for a plain date or one that is not near. */
  readonly state: DateLabelState;
  /** The chip's tone: `danger` past, `warning` soon, `default` otherwise. */
  readonly tone: Tone;
  /** The short text: "tomorrow", "3 days ago", or the medium date. */
  readonly when: string;
  /** The full date in the calendar asked for, for hover and screen readers. */
  readonly full: string;
  /** The date as an ISO 8601 string, for `<time dateTime>`. */
  readonly iso: string;
  /** Whole calendar days from now to the date: negative in the past. */
  readonly days: number;
}
