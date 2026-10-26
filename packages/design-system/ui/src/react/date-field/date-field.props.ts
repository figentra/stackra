/**
 * Stackra file contract:
 * Purpose: `DateFieldProps`, the props of the web `DateField` in `date-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (forms: one field contract);
 *          WCAG 2.2 SC 2.5.8; owner decision 6 of STA-350 (thin wrappers).
 */
import type { DateFieldRootProps } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { DateValueContractProps } from "#contracts/types/date-value-contract-props.type";

/**
 * Props of the web DateField: the shared contract plus HeroUI v3's own date field props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`, and `children` is refused because the field draws its own parts.
 */
export type DateFieldProps = DateValueContractProps &
  Omit<DateFieldRootProps<CalendarDate>, keyof DateValueContractProps | "children" | "fullWidth">;
