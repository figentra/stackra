/**
 * Stackra file contract:
 * Purpose: `RangeCalendarProps`, the props of the native `RangeCalendar`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { RangeCalendarContractProps } from "#contracts/types/range-calendar-contract-props.type";

/** Props of the native RangeCalendar. */
export type RangeCalendarProps = RangeCalendarContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
