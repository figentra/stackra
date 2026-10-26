/**
 * Stackra file contract:
 * Purpose: `CellSliderProps`, props of the web CellSlider: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { CellSliderProps as HeroCellSliderProps } from "@heroui-pro/react/cell-slider";

import type { CellSliderContractProps } from "#contracts/types/cell-slider-contract-props.type";

/** Props of the web CellSlider: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CellSliderProps = CellSliderContractProps &
  Omit<HeroCellSliderProps, keyof CellSliderContractProps | "aria-label">;
