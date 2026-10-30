/**
 * Stackra file contract:
 * Purpose: `SliderContractProps`, the props every runtime's `Slider` takes: one value on a track, with optional marks,
 *          a vertical layout and a number input paired beside it.
 * Boundary: types only; the values are written in the customer's digits and `formatOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { SliderMark } from "#contracts/types/slider-mark.type";

/** Props shared by the web and native `Slider`. */
export interface SliderContractProps extends FieldContractProps<number> {
  /** The lowest value; defaults to 0. */
  readonly minValue?: number | undefined;
  /** The highest value; defaults to 100. */
  readonly maxValue?: number | undefined;
  /** The step; defaults to 1. */
  readonly step?: number | undefined;
  /** How the value is written, for example a currency or a percent. */
  readonly formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Labelled stops under the track; they are drawn only, the value is still read by the thumb. */
  readonly marks?: readonly SliderMark[] | undefined;
  /** `horizontal` (the default) or `vertical`, filling from the bottom. */
  readonly orientation?: Orientation | undefined;
  /** True to pair the slider with a number input, so an exact value can be typed. Horizontal only. */
  readonly hasInput?: boolean | undefined;
}
