/**
 * Stackra file contract:
 * Purpose: `AngleSliderProps`, the props of the native `AngleSlider`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { AngleSliderContractProps } from "#contracts/types/angle-slider-contract-props.type";

/** Props of the native AngleSlider. */
export type AngleSliderProps = AngleSliderContractProps & {
  /** Styles the outer view. */
  readonly className?: string | undefined;
};
