/**
 * Stackra file contract:
 * Purpose: `StudioRangeProps`: props of `StudioRange`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link StudioRange}. */
export interface StudioRangeProps {
  /** The visible label. */
  label: string;
  /** The value shown. */
  value: number;
  /** The least value. */
  min: number;
  /** The greatest value. */
  max: number;
  /** The step between values. */
  step: number;
  /** The unit written after the value. */
  unit?: string;
  /** True to refuse changes. */
  isDisabled?: boolean;
  /** Called with the new value. */
  onChange: (value: number) => void;
}
