/**
 * Stackra file contract:
 * Purpose: `AngleSliderProps`, the props of the web `AngleSlider`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { AngleSliderContractProps } from "#contracts/types/angle-slider-contract-props.type";

/** Props of the web AngleSlider. */
export type AngleSliderProps = AngleSliderContractProps & {
  /** Styles the outer element. */
  readonly className?: string | undefined;
};
