/**
 * Stackra file contract:
 * Purpose: the props every runtime's `RangeSlider` takes: a low and a high value on one track with two thumbs.
 * Boundary: types only; the numbers are written in the customer's digits.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `RangeSlider`. */
export interface RangeSliderContractProps extends FieldContractProps<readonly [number, number]> {
  /** The lowest value; defaults to 0. */
  readonly minValue?: number | undefined;
  /** The highest value; defaults to 100. */
  readonly maxValue?: number | undefined;
  /** The step; defaults to 1. */
  readonly step?: number | undefined;
  /** How the values are written, for example a currency. */
  readonly formatOptions?: Intl.NumberFormatOptions | undefined;
}
