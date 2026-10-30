/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SlideToConfirm` takes: a track whose thumb the person slides to the reading end to confirm a weighty action (charge, close the shift), with a keyboard and screen-reader path that confirms at once.
 * Boundary: types only. The thumb springs back short of the end.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";

/** Props shared by the web and native `SlideToConfirm`. */
export interface SlideToConfirmContractProps {
  /** The instruction on the track and the accessible name, for example "Slide to charge 245.50 SAR". */
  readonly label: string;
  /** The text once confirmed, for example "Charged". Defaults to `label`. */
  readonly confirmedLabel?: string | undefined;
  /** Called once when the thumb reaches the end, or the keyboard or screen reader confirms. */
  readonly onConfirm?: (() => void) | undefined;
  /** True to hold the confirmed state; false resets the thumb. Uncontrolled when left out. */
  readonly isConfirmed?: boolean | undefined;
  /** The colour of the thumb and fill. Defaults to `primary`. */
  readonly variant?: Extract<ButtonVariant, "primary" | "danger"> | undefined;
  /** True to refuse sliding. */
  readonly isDisabled?: boolean | undefined;
}
