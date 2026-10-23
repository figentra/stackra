/**
 * Stackra file contract:
 * Purpose: the web `CellSlider` compound on HeroUI Pro's CellSlider (a range slider styled as a settings cell): the
 *          root maps `label` to `aria-label`; the `variant` and every other prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `CellSlider.Root` is left out. Imports the `cell-slider` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  CellSlider as HeroCellSlider,
  type CellSliderProps as HeroCellSliderProps,
} from "@heroui-pro/react/cell-slider";

import type { CellSliderContractProps } from "#contracts/types/cell-slider-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web CellSlider: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CellSliderProps = CellSliderContractProps &
  Omit<HeroCellSliderProps, keyof CellSliderContractProps | "aria-label">;

/** The root: HeroUI Pro's, with `label` as the accessible name. */
function CellSliderRoot({ label, isDisabled, ...rest }: CellSliderProps) {
  return <HeroCellSlider.Root {...rest} {...omitUndefined({ isDisabled, "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface CellSliderParts {
  /** The track that holds the fill, the thumb, the label and the output. */
  readonly Track: typeof HeroCellSlider.Track;
  /** The filled part of the track, up to the thumb. */
  readonly Fill: typeof HeroCellSlider.Fill;
  /** The draggable handle. */
  readonly Thumb: typeof HeroCellSlider.Thumb;
  /** The visible label of the cell. */
  readonly Label: typeof HeroCellSlider.Label;
  /** The formatted current value. */
  readonly Output: typeof HeroCellSlider.Output;
}

/**
 * A range slider styled as a settings cell: `CellSlider.Track` holds `CellSlider.Fill`, `CellSlider.Thumb`,
 * `CellSlider.Label` and `CellSlider.Output`. Name it for screen readers with `label`.
 */
export const CellSlider: typeof CellSliderRoot & CellSliderParts = Object.assign(CellSliderRoot, {
  Track: HeroCellSlider.Track,
  Fill: HeroCellSlider.Fill,
  Thumb: HeroCellSlider.Thumb,
  Label: HeroCellSlider.Label,
  Output: HeroCellSlider.Output,
});
