/**
 * Stackra file contract:
 * Purpose: the props every runtime's `YearPicker` takes: a grid of years, one of which is chosen.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";

/** Props shared by the web and native `YearPicker`. */
export interface YearPickerContractProps {
  /** The chosen Gregorian year, for a controlled picker. */
  readonly value?: number | null | undefined;
  /** The starting year, for an uncontrolled picker. */
  readonly defaultValue?: number | null | undefined;
  /** Called with the year chosen. */
  readonly onChange?: ((year: number) => void) | undefined;
  /** The first year; defaults to 10 years before this one. */
  readonly minYear?: number | undefined;
  /** The last year; defaults to 10 years after this one. */
  readonly maxYear?: number | undefined;
  /** The calendar the years are written in; `islamic-umalqura` adds the Hijri year under each. Defaults to `gregory`. */
  readonly calendar?: CalendarSystem | undefined;
  /** The spoken name of the grid. */
  readonly label?: string | undefined;
  /** True to refuse every change. */
  readonly isDisabled?: boolean | undefined;
}
