/**
 * Stackra file contract:
 * Purpose: what a caller hands `useConfirmation()`'s `confirm` to ask one question: the words of the dialog, its tone
 *          and icon, and, for a decision that cannot be taken back, the text the user must type before the confirming
 *          button works.
 * Boundary: types only. The typed text and its label come as a pair, so a field is never drawn without a name.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 3.3.4 and 4.1.2.
 */
import type { ReactNode } from "react";

import type { AlertDialogContractProps } from "#contracts/types/alert-dialog-contract-props.type";

/** The two ways to ask: a plain question, or one that asks the user to type a name first. */
type TypedConfirmation =
  | {
      /** The text the user must type, compared after trimming spaces from what they typed; case counts. */
      readonly confirmationText: string;
      /** The visible label of the field they type it into, for example `Type "Acme" to confirm`. */
      readonly confirmationLabel: ReactNode;
    }
  | {
      /** Left out for a plain question. */
      readonly confirmationText?: undefined;
      /** Left out for a plain question. */
      readonly confirmationLabel?: undefined;
    };

/** One question for `confirm`: the dialog's words, tone and icon, and optionally a text to type. */
export type ConfirmationOptions = Pick<
  AlertDialogContractProps,
  "title" | "description" | "confirmLabel" | "cancelLabel" | "tone" | "icon"
> &
  TypedConfirmation;
