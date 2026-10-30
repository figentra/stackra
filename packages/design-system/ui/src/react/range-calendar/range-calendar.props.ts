/**
 * Stackra file contract:
 * Purpose: `RangeCalendarProps`, the props of the web `RangeCalendar`.
 * Boundary: types only; the contract plus the outer element's class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { RangeCalendarContractProps } from "#contracts/types/range-calendar-contract-props.type";

/** Props of the web RangeCalendar. */
export type RangeCalendarProps = RangeCalendarContractProps & {
  /** Styles the calendar. */
  readonly className?: string | undefined;
};
