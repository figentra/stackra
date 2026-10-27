/**
 * Stackra file contract:
 * Purpose: `RangeCalendarPartsProps`: props of `RangeCalendarParts`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link RangeCalendarParts}. */
export interface RangeCalendarPartsProps {
  /** True to replace the heading with the year picker trigger and add the year list. */
  hasYearPicker?: boolean;
}
