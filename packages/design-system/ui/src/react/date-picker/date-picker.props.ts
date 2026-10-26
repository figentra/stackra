/**
 * Stackra file contract:
 * Purpose: `DatePickerProps`, the props of the web `DatePicker` in `date-picker.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (open state); ADR 0318 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (forms:
 *          one field contract); WCAG 2.2 SC 2.1.1, 2.5.8, 4.1.2; owner decision 6 of STA-350 (thin wrappers).
 */
import type { DatePickerRootProps } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";

/**
 * Props of the web DatePicker: the shared contract plus HeroUI v3's own date picker props, passed through unchanged.
 * `children` is refused because the picker draws its own parts.
 */
export type DatePickerProps = DatePickerContractProps &
  Omit<DatePickerRootProps<CalendarDate>, keyof DatePickerContractProps | "children">;
