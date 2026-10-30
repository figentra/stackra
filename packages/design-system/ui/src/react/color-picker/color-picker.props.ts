/**
 * Stackra file contract:
 * Purpose: `ColorPickerProps`, the props of the web `ColorPicker`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { ColorPickerContractProps } from "#contracts/types/color-picker-contract-props.type";

/** Props of the web ColorPicker. */
export type ColorPickerProps = ColorPickerContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
