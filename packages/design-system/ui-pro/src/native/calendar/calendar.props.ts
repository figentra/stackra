/**
 * Stackra file contract:
 * Purpose: `CalendarProps`, props of the native Calendar: the shared contract plus HeroUI Native Pro's own props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-011.
 */
import type { Calendar as HeroCalendar } from "heroui-native-pro/calendar";
import type { ComponentPropsWithRef } from "react";

import type { CalendarContractProps } from "#contracts/types/calendar-contract-props.type";

/**
 * Props of the native Calendar: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type CalendarProps = CalendarContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroCalendar>,
    keyof CalendarContractProps | "accessibilityLabel" | "aria-label"
  >;
