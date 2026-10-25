/**
 * Stackra file contract:
 * Purpose: the props of the `SignatureField`: a field to sign in, by drawing or by typing a name, with the field
 *          vocabulary of `@stackra/ui` (label, description, error, required, disabled, value, change) and its own
 *          labels.
 * Boundary: types only. The value is the signature mark only; signing a document is the e-signature port's.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7: props vocabulary); WCAG 2.2 SC 2.1.1 (a keyboard
 *                     way to sign).
 */
import type { ReactNode } from "react";

import type { SignatureValue } from "#contracts/types/signature-value.type";

/** Props of the `SignatureField`. */
export interface SignatureFieldContractProps {
  /** The field's label; it names the drawing area too. */
  readonly label: string;
  /** Help text under the field. */
  readonly description?: ReactNode | undefined;
  /** What is wrong, shown while `isInvalid` is true. */
  readonly errorMessage?: ReactNode | undefined;
  /** True when a form cannot be submitted unsigned. */
  readonly isRequired?: boolean | undefined;
  /** True to show the error state. */
  readonly isInvalid?: boolean | undefined;
  /** True to refuse signing. */
  readonly isDisabled?: boolean | undefined;
  /** The signature, for a controlled field; null when unsigned. */
  readonly value?: SignatureValue | null | undefined;
  /** Called with the new signature, or null when it is cleared. */
  readonly onChange?: ((value: SignatureValue | null) => void) | undefined;
  /** The clear button's text. */
  readonly clearLabel: ReactNode;
  /** The label of the typed-name input. */
  readonly typedLabel: string;
  /** The drawing box's width, in its own units. */
  readonly width?: number | undefined;
  /** The drawing box's height, in its own units. */
  readonly height?: number | undefined;
}
