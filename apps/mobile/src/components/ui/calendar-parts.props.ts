/**
 * Stackra file contract:
 * Purpose: `CalendarPartsProps`: props of `CalendarParts`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link CalendarParts}. */
export interface CalendarPartsProps {
  /** Days of the month that get a dot under the number, for example days with an event. */
  eventDays?: readonly number[];
  /** True to replace the heading with the year picker trigger and add the year list. */
  hasYearPicker?: boolean;
}
