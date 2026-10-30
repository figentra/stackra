/**
 * Stackra file contract:
 * Purpose: `CalendarProps`, the props of the web `Calendar`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { CalendarContractProps } from "#contracts/types/calendar-contract-props.type";

/** Props of the web Calendar. */
export type CalendarProps = CalendarContractProps & {
  /** Styles the calendar. */
  readonly className?: string | undefined;
};
