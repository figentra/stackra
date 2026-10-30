/**
 * Stackra file contract:
 * Purpose: `AngleSliderContractProps`, the props every runtime's `AngleSlider` takes: an angle from 0 to 359 degrees
 *          set on a dial, for a gradient's direction or a rotation.
 * Boundary: types only. Angles are absolute, so the dial is not mirrored in Arabic: 90 degrees points right in every
 *           language, and the increasing arrow keys turn it clockwise.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** Props shared by the web and native `AngleSlider`. */
export interface AngleSliderContractProps {
  /** The angle in degrees, for a controlled slider. */
  readonly value?: number | undefined;
  /** The starting angle, for an uncontrolled slider; defaults to 0. */
  readonly defaultValue?: number | undefined;
  /** Called with each new angle, 0 to 359. */
  readonly onChange?: ((value: number) => void) | undefined;
  /** The degrees one arrow key or drag stop moves; defaults to 1. Shift and Page Up/Down move 15 steps. */
  readonly step?: number | undefined;
  /** The slider's visible name, for example "Gradient angle". */
  readonly label: string;
  /** True to draw ticks at 0, 90, 180 and 270 degrees. */
  readonly hasMarks?: boolean | undefined;
  /** The dial's width and height in pixels (points on native); defaults to 160. */
  readonly size?: number | undefined;
  /** True to show the angle but refuse changes. */
  readonly isDisabled?: boolean | undefined;
}
