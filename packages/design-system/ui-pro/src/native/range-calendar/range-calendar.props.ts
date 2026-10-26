/**
 * Stackra file contract:
 * Purpose: `RangeCalendarProps`, props of the native RangeCalendar: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import type { RangeCalendar as HeroRangeCalendar } from "heroui-native-pro/range-calendar";
import type { ComponentPropsWithRef } from "react";

import type { CalendarContractProps } from "#contracts/types/calendar-contract-props.type";

/**
 * Props of the native RangeCalendar: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type RangeCalendarProps = CalendarContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroRangeCalendar>,
    keyof CalendarContractProps | "accessibilityLabel" | "aria-label"
  >;
