/**
 * Stackra file contract:
 * Purpose: `WheelTimePickerProps`, the props of the web `WheelTimePicker`.
 * Boundary: types only; the contract plus the root's own props.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { WheelTimePickerContractProps } from "#contracts/types/wheel-time-picker-contract-props.type";

/** The outer `div`'s own props, less the ones the pickers define. */
type DivProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange" | "defaultValue">;

/** Props of the web WheelTimePicker. */
export type WheelTimePickerProps = WheelTimePickerContractProps & DivProps;
