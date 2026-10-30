/**
 * Stackra file contract:
 * Purpose: `SliderProps`, the props of the native `Slider`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { SliderContractProps } from "#contracts/types/slider-contract-props.type";

/** Props of the native Slider. */
export type SliderProps = SliderContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
