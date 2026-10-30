/**
 * Stackra file contract:
 * Purpose: `WheelDatePickerProps`, the props of the web `WheelDatePicker`.
 * Boundary: types only; the contract plus the root's own props.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { WheelDatePickerContractProps } from "#contracts/types/wheel-date-picker-contract-props.type";

/** The outer `div`'s own props, less the ones the pickers define. */
type DivProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange" | "defaultValue">;

/** Props of the web WheelDatePicker. */
export type WheelDatePickerProps = WheelDatePickerContractProps & DivProps;
