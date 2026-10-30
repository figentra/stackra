/**
 * Stackra file contract:
 * Purpose: `WheelPickerProps`, the props of the web `WheelPicker`.
 * Boundary: types only; each is its contract plus the props of the outer `div`.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { ComponentPropsWithoutRef } from "react";

import type { WheelPickerContractProps } from "#contracts/types/wheel-picker-contract-props.type";

/** The outer `div`'s own props, less the ones the pickers define. */
type DivProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange" | "defaultValue">;

/** Props of the web WheelPicker. */
export type WheelPickerProps = WheelPickerContractProps & DivProps;
