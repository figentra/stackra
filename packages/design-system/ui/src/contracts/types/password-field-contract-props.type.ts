/**
 * Stackra file contract:
 * Purpose: the props every runtime's `PasswordField` takes: the field contract over the secret, the mode (any password
 *          or a numeric PIN of a set length), the reveal toggle and its spoken names, the caps-lock hint, and
 *          `isAccepted`, which plays the unlock feedback.
 * Boundary: types only. A wrong PIN is `isInvalid`: each time it turns true the field shakes (and buzzes on native).
 * Runtime: isomorphic
 * Governing contract: gap inventory row 3 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0303
 *          (decision 7); ADR 0055 (forms: one field contract); WCAG 2.2 SC 3.3.8.
 */
import type { PasswordFieldMode } from "#contracts/enums/password-field-mode.enum";
import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `PasswordField`. */
export interface PasswordFieldContractProps extends FieldContractProps<string> {
  /** `password` takes any characters; `pin` takes digits only, on the number pad. Defaults to `password`. */
  readonly mode?: PasswordFieldMode | undefined;
  /** The number of digits of a PIN; the field takes no more. Defaults to 4. */
  readonly pinLength?: number | undefined;
  /** False to hide the reveal toggle. Defaults to true. */
  readonly isRevealable?: boolean | undefined;
  /** The spoken name of the toggle while the secret is hidden. Defaults to the `ui` catalogue's "Show password". */
  readonly revealLabel?: string | undefined;
  /** The spoken name of the toggle while the secret shows. Defaults to the `ui` catalogue's "Hide password". */
  readonly concealLabel?: string | undefined;
  /** The hint shown while Caps Lock is on (web only). Defaults to the `ui` catalogue's words. */
  readonly capsLockMessage?: string | undefined;
  /** True once the secret is accepted; turning true plays the success feedback (a success haptic on native). */
  readonly isAccepted?: boolean | undefined;
  /** Hint text drawn inside the empty input. */
  readonly placeholder?: string | undefined;
  /** The look of the field. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
}
