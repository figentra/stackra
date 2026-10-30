/**
 * Stackra file contract:
 * Purpose: `TimeFieldProps`, the props of the web `TimeField`.
 * Boundary: types only; the contract plus HeroUI v3's time field props, passed through.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { TimeFieldRootProps } from "@heroui/react";
import type { Time } from "@internationalized/date";

import type { TimeFieldContractProps } from "#contracts/types/time-field-contract-props.type";

/** Props of the web TimeField. */
export type TimeFieldProps = TimeFieldContractProps &
  Omit<TimeFieldRootProps<Time>, keyof TimeFieldContractProps | "children" | "fullWidth">;
