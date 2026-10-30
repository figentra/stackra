/**
 * Stackra file contract:
 * Purpose: `RangeSliderProps`, the props of the native `RangeSlider`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { RangeSliderContractProps } from "#contracts/types/range-slider-contract-props.type";

/** Props of the native RangeSlider. */
export type RangeSliderProps = RangeSliderContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
