/**
 * Stackra file contract:
 * Purpose: the props every runtime's `MorphButton` takes: one button that changes shape with its action's state: its
 *          label, a round spinner, a green round check that settles back to the label, or the danger colour with a
 *          shake and the error words.
 * Boundary: types only. The app moves the state; the button only shows it, except that `success` settles back to
 *           the label by itself after `successDuration`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { MorphButtonState } from "#contracts/enums/morph-button-state.enum";
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `MorphButton`. */
export interface MorphButtonContractProps {
  /** The state shown. Defaults to `idle`. */
  readonly state?: MorphButtonState | undefined;
  /** The words of each state; `idle` is required, the others fall back to it (and are read aloud while shown). */
  readonly labels: { readonly idle: string } & Readonly<
    Partial<Record<Exclude<MorphButtonState, "idle">, string>>
  >;
  /** How long the success check shows before the button settles back to its label, in ms. Defaults to 1500. */
  readonly successDuration?: number | undefined;
  /** Called when the success check settles back to the label, so the app can move its state to `idle`. */
  readonly onSuccessEnd?: (() => void) | undefined;
  /** Called on a press while `idle` or `error`; presses are refused while `loading` and `success`. */
  readonly onPress?: (() => void) | undefined;
  /** The emphasis. Defaults to `primary`. */
  readonly variant?: ButtonVariant | undefined;
  /** The size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to refuse presses. */
  readonly isDisabled?: boolean | undefined;
}
