/**
 * Stackra file contract:
 * Purpose: `DateTimePickerProps`, the props of the web `DateTimePicker`.
 * Boundary: types only; the contract plus HeroUI v3's date picker props, passed through.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { DatePickerRootProps } from "@heroui/react";
import type { CalendarDateTime } from "@internationalized/date";

import type { DateTimePickerContractProps } from "#contracts/types/date-time-picker-contract-props.type";

/** Props of the web DateTimePicker. */
export type DateTimePickerProps = DateTimePickerContractProps &
  Omit<
    DatePickerRootProps<CalendarDateTime>,
    keyof DateTimePickerContractProps | "children" | "granularity"
  >;
